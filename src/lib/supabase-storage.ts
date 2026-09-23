import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

export async function uploadToSupabase(file: Express.Multer.File, bucket: string = 'logos'): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase client is not configured. Falling back to local storage.');
    return null;
  }

  const fileExt = file.originalname.split('.').pop() || 'jpg';
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = fileName;

  console.log(`[Supabase Storage] Attempting upload to bucket: "${bucket}", path: "${filePath}"`);
  
  try {
    // 1. Try to check/create target bucket if possible (ignore errors if permission is denied)
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const exists = buckets?.some(b => b.name === bucket);
      if (!exists) {
        await supabase.storage.createBucket(bucket, { public: true });
      }
    } catch (err) {
      console.warn(`[Supabase Storage Warning] Bucket auto-creation check for "${bucket}" failed, proceeding anyway:`, err);
    }

    // 2. Perform upload
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype || 'image/jpeg',
        cacheControl: '3600',
        upsert: true
      });

    // 3. Fallback logic if target bucket upload failed and it wasn't already the 'logos' bucket
    if (error && bucket !== 'logos') {
      console.log(`[Supabase Storage Info] Upload to target bucket "${bucket}" not active yet, trying logos bucket fallback...`);
      try {
        const fallbackRes = await supabase.storage
          .from('logos')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype || 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });
        
        if (!fallbackRes.error) {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);
          console.log(`[Supabase Storage Info] Successful sync to "logos" bucket: ${publicUrl}`);
          return publicUrl;
        }
      } catch (fallbackErr) {
        // Silent catch
      }
    }

    // 4. If we had an error on the main bucket and didn't/couldn't fall back, log friendly info and return null for safe local fallback
    if (error) {
      console.log(`[Supabase Storage Info] Cloud storage bucket "${bucket}" is not active. The app will seamlessly utilize local system disk storage fallback.`);
      return null;
    }

    // 5. Successful upload: get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (globalErr: any) {
    console.log('[Supabase Storage Info] Global exception occurred. Moving cleanly to local disk fallback.');
    return null;
  }
}

export async function deleteFromSupabaseByUrl(publicUrl: string): Promise<boolean> {
  if (!supabase || !publicUrl) return false;
  
  try {
    // A standard Supabase Storage URL looks like:
    // https://[project-id].supabase.co/storage/v1/object/public/[bucket-name]/[file-name]
    if (!publicUrl.includes('supabase.co/storage/v1/object/public/')) {
      return false;
    }

    const parts = publicUrl.split('/storage/v1/object/public/');
    if (parts.length < 2) return false;

    const pathParts = parts[1].split('/');
    if (pathParts.length < 2) return false;

    const bucketName = pathParts[0];
    const fileName = pathParts.slice(1).join('/');

    console.log(`[Supabase Storage] Attempting to delete file from bucket: "${bucketName}", path: "${fileName}"`);
    const { error } = await supabase.storage.from(bucketName).remove([fileName]);
    if (error) {
      console.error('[Supabase Storage Error] Failed to delete file:', error);
      return false;
    }

    console.log(`[Supabase Storage] Successfully deleted file: "${fileName}" from bucket "${bucketName}"`);
    return true;
  } catch (err) {
    console.error('[Supabase Storage Exception] Failed to delete file by URL:', err);
    return false;
  }
}
