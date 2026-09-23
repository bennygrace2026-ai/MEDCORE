import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { courses, topics, quizzes, questions, users } from '../../db/schema.js';

export const AXIAL_SKELETON_NOTE_TITLE = "Comprehensive Axial Skeleton & Clinical Osteology Lecture Notes";

export const AXIAL_SKELETON_NOTE_CONTENT = `# The Axial Skeleton & Clinical Osteology: Comprehensive Lecture Notes

## 1. Overview of the Axial Skeleton
The human adult skeleton is divided into two primary structural divisions:
1. **The Axial Skeleton (80 bones)**: Forms the central longitudinal axis of the human body, protecting the vital organs of the central nervous system, thorax, and sensory structures.
2. **The Appendicular Skeleton (126 bones)**: Forms the upper and lower limbs, as well as the shoulder and pelvic girdles that attach limbs to the axial skeleton.

### Breakdown of the 80 Axial Bones:
- **Cranium (8 bones)**: Frontal (1), Parietal (2), Temporal (2), Occipital (1), Sphenoid (1), Ethmoid (1).
- **Facial Bones (14 bones)**: Maxillae (2), Zygomatic (2), Nasal (2), Lacrimal (2), Palatine (2), Inferior Nasal Conchae (2), Mandible (1), Vomer (1).
- **Associated Skull Bones (7 bones)**:
  - Auditory Ossicles (6 bones): Malleus (2), Incus (2), Stapes (2) [Smallest bone in the body].
  - Hyoid Bone (1 bone): Does not articulate directly with any other bone; suspended by stylohyoid muscles and ligaments.
- **Vertebral Column (26 bones)**:
  - Cervical (7 vertebrae: C1-C7)
  - Thoracic (12 vertebrae: T1-T12)
  - Lumbar (5 vertebrae: L1-L5)
  - Sacrum (1 bone formed by fusion of 5 sacral vertebrae)
  - Coccyx (1 bone formed by fusion of 3-5 coccygeal vertebrae)
- **Thoracic Cage (25 bones)**:
  - Sternum (1 bone composed of Manubrium, Body, and Xiphoid process)
  - Ribs (24 bones / 12 pairs):
    - True Ribs (Pairs 1-7): Direct costal cartilage attachment to sternum
    - False Ribs (Pairs 8-10): Indirect attachment via costal cartilage of rib 7
    - Floating Ribs (Pairs 11-12): No anterior attachment, terminate in abdominal wall

---

## 2. Cranial Osteology & Key Landmarks

### The Cranial Fossae
- **Anterior Cranial Fossa**: Accommodates frontal lobes of cerebral hemispheres. Houses the cribriform plate of ethmoid bone through which CN I (Olfactory nerve) fibers pass.
- **Middle Cranial Fossa**: Accommodates temporal lobes. Features the **Sella Turcica** (hypophyseal fossa) of the sphenoid bone which cradles the pituitary gland.
- **Posterior Cranial Fossa**: Deepest fossa; contains the cerebellum, pons, and medulla oblongata. Contains the **Foramen Magnum** where medulla transitions into the spinal cord.

> **[Clinical Pearl: Fracture of the Pterion & Epidural Hematoma]**
> The **Pterion** is an H-shaped suture junction on the lateral aspect of the skull where four bones meet: Frontal, Parietal, Temporal (squamous part), and Sphenoid (greater wing). The anterior branch of the **Middle Meningeal Artery** runs on the internal groove of the pterion. Trauma to the side of the head can fracture the pterion and lacerate this artery, resulting in a rapidly expanding arterial **Epidural Hematoma** characterized by a classic "lucid interval" followed by rapid neurologic deterioration.

---

## 3. The Vertebral Column & Spinal Curvatures

### Curvatures of the Spine
- **Primary Curvatures (Fetal/Accommodation)**: Thoracic and Sacral kyphoses. Concave anteriorly.
- **Secondary Curvatures (Compensatory)**:
  - *Cervical Lordosis*: Develops when the infant begins to hold its head upright (3-4 months).
  - *Lumbar Lordosis*: Develops when the child begins standing and walking (12-18 months).

### Regional Characteristics:
- **Cervical Vertebrae (C1-C7)**: Defined by **Foramen Transversarium** in transverse processes (transmits vertebral artery, except C7 which transmits only accessory vertebral veins).
  - *C1 (Atlas)*: Ring-like, lacks body and spinous process; articulates with occipital condyles (atlanto-occipital joint = "Yes" motion).
  - *C2 (Axis)*: Features the odontoid process (**Dens**) which serves as pivot for C1 rotation (atlanto-axial joint = "No" motion).
- **Thoracic Vertebrae (T1-T12)**: Costal facets for rib articulation and long downward-pointing spinous processes.
- **Lumbar Vertebrae (L1-L5)**: Massive kidney-shaped vertebral bodies designed for weight bearing; sturdy, hatchet-shaped horizontal spinous processes ideal for spinal needles.

> **[High-Yield Concept: Lumbar Puncture & Safe Levels]**
> In the adult, the spinal cord terminates as the **conus medullaris** at the lower border of **L1 or upper border of L2**. A lumbar puncture is routinely performed at the **L3/L4 or L4/L5** interspinous space (identified by palpating the intercristal / Tuffier's line connecting the iliac crests). This safe entry passes through: Skin -> Subcutaneous tissue -> Supraspinous ligament -> Interspinous ligament -> Ligamentum flavum -> Epidural space -> Dura mater -> Arachnoid mater -> Subarachnoid space (CSF).

---

## 4. Bony Thorax & Rib Mechanics
- **Sternal Angle of Louis**: Formed at the junction of the manubrium and sternal body. It lies opposite the T4/T5 intervertebral disc level.
  - Important landmarks at this level:
    - Articulation of the 2nd costal cartilage
    - Bifurcation of the trachea (Carina)
    - Beginning and end of the aortic arch
    - Transition between superior and inferior mediastinum
- **Flail Chest**: Occurs when three or more consecutive ribs are fractured in two or more places, causing a segment of the chest wall to move paradoxically during respiration (moves inward on inspiration and outward on expiration).
`;

export const AXIAL_SKELETON_QUESTIONS = [
  {
    Question: "How many total bones comprise the adult human axial skeleton?",
    OptionA: "60 bones",
    OptionB: "80 bones",
    OptionC: "126 bones",
    OptionD: "206 bones",
    Answer: "B",
    Explanation: "The human skeleton consists of 206 bones, divided into the axial skeleton (80 bones) and the appendicular skeleton (126 bones)."
  },
  {
    Question: "Which cranial bone forms the postero-inferior floor of the cranium and contains the foramen magnum?",
    OptionA: "Sphenoid bone",
    OptionB: "Temporal bone",
    OptionC: "Occipital bone",
    OptionD: "Parietal bone",
    Answer: "C",
    Explanation: "The occipital bone forms the posterior skull and the floor of the posterior cranial fossa. Its most prominent feature is the foramen magnum, which transmits the medulla oblongata, spinal accessory nerves, and vertebral arteries."
  },
  {
    Question: "A 22-year-old athlete sustains a blow to the lateral aspect of the temple. Radiographic examination reveals a fracture through the pterion. Which vascular structure is at greatest risk of laceration, leading to an epidural hematoma?",
    OptionA: "Superior sagittal sinus",
    OptionB: "Middle meningeal artery",
    OptionC: "Internal carotid artery",
    OptionD: "Internal jugular vein",
    Answer: "B",
    Explanation: "The anterior branch of the middle meningeal artery lies on the internal surface of the pterion (where frontal, parietal, temporal, and sphenoid bones meet). Laceration of this artery causes an acute epidural hematoma."
  },
  {
    Question: "The sella turcica (hypophyseal fossa), which houses the pituitary gland, is located on which bone?",
    OptionA: "Ethmoid bone",
    OptionB: "Frontal bone",
    OptionC: "Sphenoid bone",
    OptionD: "Occipital bone",
    Answer: "C",
    Explanation: "The sella turcica ('Turkish saddle') is a prominent saddle-shaped depression in the superior surface of the body of the sphenoid bone that cradles the pituitary gland (hypophysis)."
  },
  {
    Question: "Olfactory nerve (Cranial Nerve I) fibers pass through the cribriform plate of which cranial bone to reach the anterior cranial fossa?",
    OptionA: "Ethmoid bone",
    OptionB: "Sphenoid bone",
    OptionC: "Palatine bone",
    OptionD: "Lacrimal bone",
    Answer: "A",
    Explanation: "The cribriform plate of the ethmoid bone contains numerous olfactory foramina through which bipolar olfactory sensory neurons project from the nasal mucosa into the olfactory bulbs."
  },
  {
    Question: "Which cervical vertebra is known as the 'Atlas' and is distinguished by lacking both a vertebral body and a spinous process?",
    OptionA: "C1",
    OptionB: "C2",
    OptionC: "C7",
    OptionD: "T1",
    Answer: "A",
    Explanation: "The first cervical vertebra (C1) is called the Atlas. It lacks a vertebral body and spinous process, consisting instead of an anterior and posterior arch and two lateral masses that articulate with occipital condyles."
  },
  {
    Question: "The odontoid process (dens), which serves as a pivot around which the head rotates, arises from which vertebra?",
    OptionA: "Atlas (C1)",
    OptionB: "Axis (C2)",
    OptionC: "Vertebra Prominens (C7)",
    OptionD: "Occipital bone",
    Answer: "B",
    Explanation: "The dens (odontoid process) is a tooth-like superior projection of the second cervical vertebra (C2, or Axis). It acts as the pivot for rotation of the atlas at the median atlanto-axial joint."
  },
  {
    Question: "Which unique anatomical landmark is present in ALL cervical vertebrae (C1 through C7) and absent in thoracic and lumbar vertebrae?",
    OptionA: "Bifid spinous process",
    OptionB: "Costal facets",
    OptionC: "Foramen transversarium (transverse foramen)",
    OptionD: "Prominent mammillary process",
    Answer: "C",
    Explanation: "The defining hallmark of cervical vertebrae is the transverse foramen (foramen transversarium) located in the transverse processes, through which the vertebral artery and vertebral veins pass (except C7 where the artery bypasses the foramen)."
  },
  {
    Question: "Which pairs of ribs are classified as 'true ribs' (vertebrosternal ribs) because their costal cartilages connect directly to the sternum?",
    OptionA: "Ribs 1 through 5",
    OptionB: "Ribs 1 through 7",
    OptionC: "Ribs 8 through 10",
    OptionD: "Ribs 11 and 12",
    Answer: "B",
    Explanation: "Ribs 1 to 7 are true ribs (vertebrosternal) because their costal cartilages articulate directly with the sternum. Ribs 8-10 are false ribs (vertebrochondral), and ribs 11-12 are floating ribs (vertebral)."
  },
  {
    Question: "Ribs 11 and 12 are designated as 'floating ribs' primarily because:",
    OptionA: "They have no posterior vertebral articulation",
    OptionB: "They have no anterior attachment and terminate in lateral abdominal wall muscles",
    OptionC: "They articulate directly with the lumbar vertebrae",
    OptionD: "They lack costal grooves",
    Answer: "B",
    Explanation: "Ribs 11 and 12 do not attach to the sternum anteriorly or to other costal cartilages; their anterior cartilaginous ends terminate freely in the musculature of the anterolateral abdominal wall."
  },
  {
    Question: "The sternal angle (Angle of Louis) marks the junction between which two parts of the sternum?",
    OptionA: "Manubrium and Clavicle",
    OptionB: "Manubrium and Body of the sternum",
    OptionC: "Body of the sternum and Xiphoid process",
    OptionD: "Jugular notch and Clavicular notch",
    Answer: "B",
    Explanation: "The sternal angle is the palpable transverse ridge at the manubriosternal joint, located at the T4/T5 vertebral level, where the second costal cartilage articulates."
  },
  {
    Question: "Which U-shaped bone in the anterior neck does NOT articulate with any other bone in the skeleton?",
    OptionA: "Mandible",
    OptionB: "Hyoid bone",
    OptionC: "Thyroid cartilage",
    OptionD: "Cricoid cartilage",
    Answer: "B",
    Explanation: "The hyoid bone is unique in the human skeleton because it is completely isolated from other bony articulations, held suspended by muscles and the stylohyoid ligaments."
  },
  {
    Question: "Which auditory ossicle articulates directly with the oval window of the temporal bone and is the smallest bone in the human body?",
    OptionA: "Malleus",
    OptionB: "Incus",
    OptionC: "Stapes",
    OptionD: "Vomer",
    Answer: "C",
    Explanation: "The stapes ('stirrup') is the smallest bone in the human skeleton. Its footplate fits into the oval window (fenestra vestibuli) of the middle ear."
  },
  {
    Question: "In a healthy adult human, how many individual vertebrae constitute the lumbar region of the spine?",
    OptionA: "4",
    OptionB: "5",
    OptionC: "7",
    OptionD: "12",
    Answer: "B",
    Explanation: "There are 5 lumbar vertebrae (L1 to L5), characterized by large, kidney-shaped bodies and absence of costal facets or transverse foramina."
  },
  {
    Question: "An abnormal lateral curvature of the vertebral column with associated vertebral rotation is clinically known as:",
    OptionA: "Kyphosis",
    OptionB: "Lordosis",
    OptionC: "Scoliosis",
    OptionD: "Spondylolisthesis",
    Answer: "C",
    Explanation: "Scoliosis is an abnormal lateral deviation and rotational deformity of the spine, most commonly idiopathic in adolescent females."
  },
  {
    Question: "An excessive posterior curvature of the thoracic spine leading to a 'hunchback' appearance is termed:",
    OptionA: "Kyphosis",
    OptionB: "Lordosis",
    OptionC: "Scoliosis",
    OptionD: "Spondylolysis",
    Answer: "A",
    Explanation: "Kyphosis is an exaggerated posterior curvature of the thoracic vertebral column, commonly seen in elderly patients with osteoporosis or Scheuermann disease."
  },
  {
    Question: "At what vertebral level does the adult spinal cord (conus medullaris) typically terminate?",
    OptionA: "T10-T11",
    OptionB: "L1-L2",
    OptionC: "L4-L5",
    OptionD: "S1-S2",
    Answer: "B",
    Explanation: "In normal adults, the spinal cord terminates at the L1-L2 intervertebral disc space as the conus medullaris. Below this, the subarachnoid space forms the lumbar cistern containing the cauda equina."
  },
  {
    Question: "To perform a safe lumbar puncture in an adult without injuring the spinal cord, between which vertebral levels is the needle introduced?",
    OptionA: "T12-L1",
    OptionB: "L1-L2",
    OptionC: "L3-L4 or L4-L5",
    OptionD: "S1-S2",
    Answer: "C",
    Explanation: "Because the spinal cord ends at L1-L2, a lumbar puncture is safely performed at the L3-L4 or L4-L5 intervertebral space into the lumbar cistern, well below the conus medullaris."
  },
  {
    Question: "Which curvatures of the human vertebral column are primary curvatures that are present at birth and retain their fetal concavity?",
    OptionA: "Cervical and Lumbar",
    OptionB: "Thoracic and Sacral",
    OptionC: "Cervical and Thoracic",
    OptionD: "Lumbar and Sacral",
    Answer: "B",
    Explanation: "The thoracic and sacral curvatures are primary (accommodating) curvatures present in embryonic development, concave anteriorly."
  },
  {
    Question: "Which ligament prevents hyperextension of the vertebral column and runs continuously along the anterior surfaces of all vertebral bodies?",
    OptionA: "Posterior longitudinal ligament",
    OptionB: "Anterior longitudinal ligament",
    OptionC: "Ligamentum flavum",
    OptionD: "Interspinous ligament",
    Answer: "B",
    Explanation: "The anterior longitudinal ligament (ALL) runs along the anterior and anterolateral surfaces of vertebral bodies from the occiput to the sacrum, strongly preventing spinal hyperextension."
  },
  {
    Question: "Which ligament connects adjacent vertebral laminae and has a high elastin content imparting a yellowish appearance?",
    OptionA: "Ligamentum flavum",
    OptionB: "Supraspinous ligament",
    OptionC: "Ligamentum nuchae",
    OptionD: "Intertransverse ligament",
    Answer: "A",
    Explanation: "Ligamentum flavum (yellow ligament) bridges the laminae of adjacent vertebrae. Its high elastic fiber content gives it a distinct yellow appearance and provides a tactile 'pop' during spinal needle insertion."
  },
  {
    Question: "The outer concentric fibrocartilage ring of an intervertebral disc that confines the central nucleus pulposus is the:",
    OptionA: "Ligamentum denticulatum",
    OptionB: "Anulus fibrosus",
    OptionC: "Zona pellucida",
    OptionD: "Articular capsule",
    Answer: "B",
    Explanation: "Each intervertebral disc consists of an outer peripheral anulus fibrosus (composed of concentric fibrocartilage rings) surrounding a gelatinous inner nucleus pulposus."
  },
  {
    Question: "In a posterolateral intervertebral disc herniation at the L4-L5 level, which spinal nerve root is most commonly impinged?",
    OptionA: "L3 nerve root",
    OptionB: "L4 nerve root",
    OptionC: "L5 nerve root",
    OptionD: "S1 nerve root",
    Answer: "C",
    Explanation: "In the lumbar spine, nerve roots exit above the lower pedicle. A posterolateral herniation at L4-L5 compresses the traversing L5 nerve root as it descends toward the L5-S1 foramen."
  },
  {
    Question: "Traumatic spondylolisthesis of the axis (C2) resulting from acute severe hyperextension of the head and neck is classically termed:",
    OptionA: "Jefferson fracture",
    OptionB: "Clay-shoveler fracture",
    OptionC: "Hangman's fracture",
    OptionD: "Chance fracture",
    Answer: "C",
    Explanation: "Hangman's fracture is a bilateral fracture of the pars interarticularis / pedicles of C2 (axis) caused by severe cervical hyperextension."
  },
  {
    Question: "A burst fracture of the C1 (atlas) ring caused by high-energy vertical compressive loading onto the vertex of the skull is known as a:",
    OptionA: "Hangman's fracture",
    OptionB: "Jefferson fracture",
    OptionC: "Chance fracture",
    OptionD: "Teardrop fracture",
    Answer: "B",
    Explanation: "A Jefferson fracture is a 4-part burst fracture of the anterior and posterior arches of the atlas (C1) produced by axial compressive loading (e.g. diving headfirst into shallow water)."
  }
];

export async function seedOrRestoreAxialSkeletonQuiz(targetDb?: any): Promise<{
  success: boolean;
  courseId: string;
  topicId: string;
  quizId: string;
  questionsCount: number;
  message: string;
}> {
  const database = targetDb || db;
  console.log('[Seed/Restore] Checking Axial Skeleton quiz status...');

  // 1. Get or create Super Admin user
  let adminUser = await database.select().from(users).where(eq(users.email, 'bennygrace2026@gmail.com')).limit(1);
  let adminId = adminUser[0]?.id;
  if (!adminId) {
    const allAdmins = await database.select().from(users).where(eq(users.role, 'SUPER_ADMIN')).limit(1);
    adminId = allAdmins[0]?.id;
  }
  if (!adminId) {
    const anyUser = await database.select().from(users).limit(1);
    adminId = anyUser[0]?.id || 'system_faculty_admin';
  }

  // 2. Check if Course "Human Gross Anatomy & Osteology" exists, or create it
  let course = await database.select().from(courses).where(eq(courses.code, 'ANAT 201')).limit(1);
  let courseId = course[0]?.id;

  if (!courseId) {
    courseId = uuidv4();
    await database.insert(courses).values({
      id: courseId,
      title: 'Human Gross Anatomy & Osteology',
      code: 'ANAT 201',
      description: 'Comprehensive clinical study of human bones, joints, cranial osteology, vertebral dynamics, and thoracic cage architecture with high-yield USMLE/medical board clinical correlations.',
      thumbnail: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=800',
      noteTitle: AXIAL_SKELETON_NOTE_TITLE,
      noteContent: AXIAL_SKELETON_NOTE_CONTENT,
      pdfUrl: null,
      pdfName: null,
      pdfSize: null,
      isPublished: true,
      isProtected: true,
      authorId: adminId,
      createdAt: new Date()
    });
    console.log('[Seed/Restore] Created ANAT 201 course with notes');
  } else {
    // Ensure the course has the notes attached if missing
    if (!course[0].noteContent) {
      await database.update(courses)
        .set({
          noteTitle: AXIAL_SKELETON_NOTE_TITLE,
          noteContent: AXIAL_SKELETON_NOTE_CONTENT,
          isPublished: true
        })
        .where(eq(courses.id, courseId));
    }
  }

  // 3. Check if Topic exists
  let topic = await database.select().from(topics).where(eq(topics.title, 'The Axial Skeleton: Cranium, Vertebrae & Thorax')).limit(1);
  let topicId = topic[0]?.id;

  if (!topicId) {
    topicId = uuidv4();
    await database.insert(topics).values({
      id: topicId,
      courseId,
      title: 'The Axial Skeleton: Cranium, Vertebrae & Thorax',
      description: 'Cranial bones, cranial fossae, foramina, regional vertebral column morphology, sternum, and rib cage kinematics.',
      orderIndex: 1,
      createdAt: new Date()
    });
    console.log('[Seed/Restore] Created Axial Skeleton topic');
  }

  // 4. Check if Quiz exists
  let quiz = await database.select().from(quizzes).where(eq(quizzes.title, 'Axial Skeleton & Cranial Anatomy Quiz')).limit(1);
  if (!quiz.length) {
    // Try matching partial title
    const allQ = await database.select().from(quizzes);
    const existing = allQ.find((q: any) => q.title.toLowerCase().includes('axial skeleton'));
    if (existing) {
      quiz = [existing];
    }
  }

  let quizId = quiz[0]?.id;
  if (!quizId) {
    quizId = uuidv4();
    await database.insert(quizzes).values({
      id: quizId,
      topicId,
      title: 'Axial Skeleton & Cranial Anatomy Quiz',
      description: 'Official 25-Question High-Yield Medical Board Quiz covering skull bones, sutures, vertebral anatomy, thoracic cage, and high-yield clinical fractures.',
      timeLimitMinutes: 30,
      createdAt: new Date()
    });
    console.log('[Seed/Restore] Created Axial Skeleton quiz');
  }

  // 5. Populate Questions if needed
  const existingQuestions = await database.select().from(questions).where(eq(questions.quizId, quizId));
  if (existingQuestions.length === 0) {
    console.log(`[Seed/Restore] Inserting ${AXIAL_SKELETON_QUESTIONS.length} questions for Axial Skeleton quiz...`);
    const questionsToInsert = AXIAL_SKELETON_QUESTIONS.map((q, idx) => ({
      id: uuidv4(),
      quizId,
      text: q.Question,
      optionA: q.OptionA,
      optionB: q.OptionB,
      optionC: q.OptionC,
      optionD: q.OptionD,
      correctAnswer: q.Answer,
      explanation: q.Explanation,
      orderIndex: idx
    }));

    await database.insert(questions).values(questionsToInsert);
    console.log('[Seed/Restore] Successfully seeded all 25 Axial Skeleton questions.');
    return {
      success: true,
      courseId,
      topicId,
      quizId,
      questionsCount: questionsToInsert.length,
      message: `Axial Skeleton Quiz and Course restored with ${questionsToInsert.length} questions and lecture notes.`
    };
  }

  return {
    success: true,
    courseId,
    topicId,
    quizId,
    questionsCount: existingQuestions.length,
    message: `Axial Skeleton Quiz is already active with ${existingQuestions.length} questions.`
  };
}

export const restoreAxialSkeletonQuiz = seedOrRestoreAxialSkeletonQuiz;

