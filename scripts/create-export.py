import os
import zipfile
import tarfile

def create_export():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    export_zip_path = os.path.join(root_dir, 'medcore-academy-export.zip')
    export_tar_path = os.path.join(root_dir, 'medcore-academy-export.tar.gz')

    exclude_dirs = {
        'node_modules',
        '.git',
        '.cache',
        '.turbo',
        '.npm'
    }

    exclude_files = {
        'local.db',
        'local.db-journal',
        'medcore-academy-export.zip',
        'medcore-academy-export.tar.gz'
    }

    print(f"Creating export from: {root_dir}")

    # Create ZIP archive
    with zipfile.ZipFile(export_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for foldername, subfolders, filenames in os.walk(root_dir):
            # Prune excluded directories
            subfolders[:] = [d for d in subfolders if d not in exclude_dirs]
            for filename in filenames:
                if filename in exclude_files or filename.endswith('.log'):
                    continue
                file_path = os.path.join(foldername, filename)
                rel_path = os.path.relpath(file_path, root_dir)
                zipf.write(file_path, rel_path)

    # Create TAR.GZ archive as well
    with tarfile.open(export_tar_path, "w:gz") as tar:
        for foldername, subfolders, filenames in os.walk(root_dir):
            subfolders[:] = [d for d in subfolders if d not in exclude_dirs]
            for filename in filenames:
                if filename in exclude_files or filename.endswith('.log'):
                    continue
                file_path = os.path.join(foldername, filename)
                rel_path = os.path.relpath(file_path, root_dir)
                tar.add(file_path, arcname=rel_path)

    zip_size_mb = os.path.getsize(export_zip_path) / (1024 * 1024)
    tar_size_mb = os.path.getsize(export_tar_path) / (1024 * 1024)

    # Also place copies in public and dist directories for direct download
    for dest_dir in [os.path.join(root_dir, 'public'), os.path.join(root_dir, 'dist')]:
        if os.path.exists(dest_dir):
            import shutil
            shutil.copy2(export_zip_path, os.path.join(dest_dir, 'medcore-academy-export.zip'))
            shutil.copy2(export_tar_path, os.path.join(dest_dir, 'medcore-academy-export.tar.gz'))

    print(f"Export created successfully:")
    print(f"1. {export_zip_path} ({zip_size_mb:.2f} MB)")
    print(f"2. {export_tar_path} ({tar_size_mb:.2f} MB)")

if __name__ == '__main__':
    create_export()
