# Video-extracted test data (JSON)

**Source:** `vidma_recorder_28102026_164741.mp4` (repo root, `origin/main`), 79s phone screen-recording of the
real PW Parent app → All Tests (Objective) list + per-test detail screens of one student.
**Method:** frames extracted at 2 fps, duplicate frames dropped, each screen read at full resolution.
Every subject total below was cross-checked against its chapter marks and against the card score — all sums tie out.
**Not in the video:** the student's name (never shown), audio (not transcribable here), Subjective tab (empty —
"No tests found"), Milestone:3 / Milestone:1 detail screens (cards only), Milestone:8 Botany/Zoology chapters
(accordions never opened), AITS Practice Test:1 accuracy/top/avg rows (scrolled past).

```json
{
  "source": {
    "video": "vidma_recorder_28102026_164741.mp4",
    "screen": "PW Parent app → All Tests → Objective tab + test detail screens",
    "paperType": "Objective",
    "note": "One student's complete test history as shown; ranks/top/avg are class figures stamped by PW."
  },
  "tests": [
    {
      "title": "AITS - 3",
      "date": "2026-11-01",
      "mode": "Offline",
      "status": "UPCOMING",
      "marksObtained": null,
      "marksTotal": 720,
      "rank": null,
      "subjects": []
    },
    {
      "title": "Milestone:8",
      "date": "2026-10-25",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 156,
      "marksTotal": 720,
      "scorePercent": 22,
      "rank": 2720,
      "accuracyPercent": 96.65,
      "correctCount": 49,
      "topScore": 686,
      "avgScore": 318.09,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 12,
          "chapters": [
            {"chapter": "Dual Nature of Radiation and Matter", "marks": 5},
            {"chapter": "Atoms", "marks": 2},
            {"chapter": "Semiconductor Electronics: Materials, Devices", "marks": 0},
            {"chapter": "Nuclei", "marks": 7},
            {"chapter": "Wave Optics", "marks": -2}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 14,
          "chapters": [
            {"chapter": "The D and F-Block Elements", "marks": 14},
            {"chapter": "The P-Block Elements", "marks": 1},
            {"chapter": "Coordination Compounds", "marks": 0},
            {"chapter": "Principles of Qualitative Analysis", "marks": -1}
          ]
        },
        {"subject": "Botany", "obtained": 47, "chapters": [], "note": "chapters not opened in video"},
        {"subject": "Zoology", "obtained": 83, "chapters": [], "note": "chapters not opened in video"}
      ]
    },
    {
      "title": "AITS - 2",
      "date": "2026-09-20",
      "mode": "Offline",
      "status": "MISSED",
      "marksObtained": null,
      "marksTotal": 720,
      "rank": null,
      "subjects": []
    },
    {
      "title": "Milestone:7",
      "date": "2026-09-13",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 230,
      "marksTotal": 720,
      "scorePercent": 32,
      "rank": 2685,
      "accuracyPercent": 95.56,
      "correctCount": 83,
      "topScore": 680,
      "avgScore": 215.36,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 50,
          "chapters": [
            {"chapter": "Electromagnetic Waves", "marks": 15},
            {"chapter": "Ray Optics and Optical Instruments", "marks": 35}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 35,
          "chapters": [
            {"chapter": "Biomolecules", "marks": 24},
            {"chapter": "Amines", "marks": 11}
          ]
        },
        {
          "subject": "Botany",
          "obtained": 90,
          "chapters": [{"chapter": "Microbes in Human Welfare", "marks": 90}]
        },
        {
          "subject": "Zoology",
          "obtained": 55,
          "chapters": [{"chapter": "Human Health and Disease", "marks": 55}]
        }
      ]
    },
    {
      "title": "Common Assessment Test (CAT-1)",
      "date": "2026-09-06",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 371,
      "marksTotal": 720,
      "scorePercent": 52,
      "rank": 1541,
      "accuracyPercent": 98.09,
      "correctCount": 100,
      "topScore": 712,
      "avgScore": 357.17,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 86,
          "chapters": [
            {"chapter": "Current Electricity", "marks": 20},
            {"chapter": "Electric Charges and Fields", "marks": 40},
            {"chapter": "Electrostatic Potential and Capacitance", "marks": 26}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 59,
          "chapters": [
            {"chapter": "Chemical Kinetics", "marks": 19},
            {"chapter": "Haloalkanes and Haloarenes", "marks": 9},
            {"chapter": "Solutions", "marks": 27},
            {"chapter": "Hydrocarbons", "marks": 4}
          ]
        },
        {
          "subject": "Botany",
          "obtained": 88,
          "chapters": [
            {"chapter": "Sexual Reproduction in Flowering Plants", "marks": 48},
            {"chapter": "Molecular Basis of Inheritance", "marks": 40}
          ]
        },
        {
          "subject": "Zoology",
          "obtained": 138,
          "chapters": [
            {"chapter": "Human Reproduction", "marks": 73},
            {"chapter": "Reproductive Health", "marks": 65}
          ]
        }
      ]
    },
    {
      "title": "Milestone:6",
      "date": "2026-08-23",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 469,
      "marksTotal": 720,
      "scorePercent": 65,
      "rank": 699,
      "accuracyPercent": 96.11,
      "correctCount": 127,
      "topScore": 685,
      "avgScore": 316.93,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 96,
          "chapters": [
            {"chapter": "Electromagnetic Induction", "marks": 61},
            {"chapter": "Alternating Current", "marks": 35}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 146,
          "chapters": [{"chapter": "Aldehydes, Ketones and Carboxylic Acids", "marks": 146}]
        },
        {
          "subject": "Botany",
          "obtained": 110,
          "chapters": [{"chapter": "Principles of Inheritance and Variation", "marks": 110}]
        },
        {
          "subject": "Zoology",
          "obtained": 117,
          "chapters": [{"chapter": "Evolution", "marks": 117}]
        }
      ]
    },
    {
      "title": "AITS - 1",
      "date": "2026-08-09",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 0,
      "marksTotal": 720,
      "scorePercent": 0,
      "rank": 27547,
      "accuracyPercent": 100.0,
      "correctCount": 0,
      "topScore": 720,
      "avgScore": 229.24,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 0,
          "chapters": [{"chapter": "Electric Charges and Fields", "marks": 0}]
        },
        {"subject": "Chemistry", "obtained": 0, "chapters": []},
        {"subject": "Zoology", "obtained": 0, "chapters": []},
        {"subject": "Botany", "obtained": 0, "chapters": []}
      ]
    },
    {
      "title": "Milestone:5",
      "date": "2026-08-02",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 465,
      "marksTotal": 720,
      "scorePercent": 65,
      "rank": 633,
      "accuracyPercent": 98.32,
      "correctCount": 129,
      "topScore": 705,
      "avgScore": 308.83,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 115,
          "chapters": [
            {"chapter": "Moving Charges and Magnetism", "marks": 68},
            {"chapter": "Magnetism and Matter", "marks": 47}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 130,
          "chapters": [
            {"chapter": "Haloalkanes and Haloarenes", "marks": 60},
            {"chapter": "Alcohols, Phenols and Ethers", "marks": 70}
          ]
        },
        {
          "subject": "Botany",
          "obtained": 100,
          "chapters": [{"chapter": "Principles of Inheritance and Variation", "marks": 100}]
        },
        {
          "subject": "Zoology",
          "obtained": 120,
          "chapters": [{"chapter": "Evolution", "marks": 120}]
        }
      ]
    },
    {
      "title": "AITS Practice Test:1",
      "date": "2026-07-26",
      "mode": "Online",
      "status": "ATTEMPTED",
      "marksObtained": 0,
      "marksTotal": 720,
      "scorePercent": 0,
      "rank": null,
      "accuracyPercent": null,
      "correctCount": 0,
      "topScore": null,
      "avgScore": null,
      "note": "rank shown as N/A; accuracy/top/avg rows never visible in video",
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 0,
          "chapters": [{"chapter": "Electric Charges and Fields", "marks": 0}]
        },
        {"subject": "Chemistry", "obtained": 0, "chapters": []},
        {"subject": "Zoology", "obtained": 0, "chapters": []},
        {"subject": "Botany", "obtained": 0, "chapters": []}
      ]
    },
    {
      "title": "Milestone:4",
      "date": "2026-07-12",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 212,
      "marksTotal": 720,
      "scorePercent": 29,
      "rank": 4085,
      "accuracyPercent": 99.01,
      "correctCount": 75,
      "topScore": 702,
      "avgScore": 340.48,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 32,
          "chapters": [
            {"chapter": "Electric Charges and Fields", "marks": 14},
            {"chapter": "Electrostatic Potential and Capacitance", "marks": 11},
            {"chapter": "Current Electricity", "marks": 7}
          ]
        },
        {
          "subject": "Chemistry",
          "obtained": 15,
          "chapters": [
            {"chapter": "Solutions", "marks": 4},
            {"chapter": "Electrochemistry", "marks": 6},
            {"chapter": "Chemical Kinetics", "marks": 1},
            {"chapter": "Organic Chemistry: Some Basic Principles and Techniques", "marks": 4}
          ]
        },
        {
          "subject": "Botany",
          "obtained": 65,
          "chapters": [
            {"chapter": "Sexual Reproduction in Flowering Plants", "marks": 36},
            {"chapter": "Molecular Basis of Inheritance", "marks": 29}
          ]
        },
        {
          "subject": "Zoology",
          "obtained": 100,
          "chapters": [
            {"chapter": "Human Reproduction", "marks": 63},
            {"chapter": "Reproductive Health", "marks": 37}
          ]
        }
      ]
    },
    {
      "title": "Milestone:3",
      "date": "2026-06-28",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 375,
      "marksTotal": 720,
      "scorePercent": 52,
      "rank": 1792,
      "accuracyPercent": null,
      "correctCount": null,
      "topScore": null,
      "avgScore": null,
      "note": "detail screen never opened in video — card figures only",
      "subjects": []
    },
    {
      "title": "Milestone:2",
      "date": "2026-06-01",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 405,
      "marksTotal": 720,
      "scorePercent": 56,
      "rank": 1705,
      "accuracyPercent": 98.88,
      "correctCount": 113,
      "topScore": 706,
      "avgScore": 373.09,
      "subjects": [
        {
          "subject": "Physics",
          "obtained": 104,
          "chapters": [{"chapter": "Electrostatic Potential and Capacitance", "marks": 104}]
        },
        {"subject": "Chemistry", "obtained": 85, "chapters": [{"chapter": "Solutions", "marks": 85}]},
        {
          "subject": "Botany",
          "obtained": 135,
          "chapters": [{"chapter": "Sexual Reproduction in Flowering Plants", "marks": 135}]
        },
        {"subject": "Zoology", "obtained": 81, "chapters": [{"chapter": "Human Reproduction", "marks": 81}]}
      ]
    },
    {
      "title": "Milestone:1",
      "date": "2026-05-17",
      "mode": "Offline",
      "status": "ATTEMPTED",
      "marksObtained": 575,
      "marksTotal": 720,
      "scorePercent": 80,
      "rank": 500,
      "accuracyPercent": null,
      "correctCount": null,
      "topScore": null,
      "avgScore": null,
      "note": "detail screen never opened in video — card figures only",
      "subjects": []
    }
  ]
}
```

## Cross-checks performed

- Every `subjects[].obtained` equals the sum of its `chapters[].marks` (where chapters were visible).
- Every test's four subject obtained figures sum exactly to `marksObtained` (156, 230, 371, 469, 465, 212, 405…).
- `scorePercent` matches `marksObtained / 720` rounded (156→22%, 469→65%, 575→80%…).
- Negative chapter marks are real (Milestone:8 Wave Optics −2, Principles of Qualitative Analysis −1) — negative
  marking, so the JSON/import must allow negatives.

## Open questions for the JSON-query feature (plan banane ke liye, abhi code nahi)

1. **Scope:** JSON query se sirf TEST create ho (batch-level: title/date/mode/syllabus), ya test ke saath saare
   students ke RESULTS bhi ek saath (video wala data ek student ka hai — batch me baaki students ke marks kahan se)?
2. **Rank/top/avg:** video me ye PW ke class-wide figures hain. Hamare system me ye admin-declared hain — JSON me
   aaye to seed ho jayein, na aaye to admin baad me bhare?
3. **Existing data:** JSON import duplicate titles (Milestone:8 dobara) pe skip kare ya update?
4. **Negative marks:** chapter marks negative aa sakte hain — result form abhi sirf digits leta hai
   (`replace(/[^\d.]/g,'')`), plan me iska allowance chahiye.
5. **Subjective tab:** video me empty tha — JSON schema me paperType Objective/Subjective dono support karein?
