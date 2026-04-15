import re
import shutil
from pdfminer.high_level import extract_text


def _looks_like_usable_dars_text(text: str) -> bool:
    """True if extracted text plausibly contains a UCLA degree audit (not just a PDF shell)."""
    collapsed = " ".join(text.split())
    if len(collapsed) < 500:
        return False
    u = collapsed.upper()
    if "UCLA" not in u:
        return False
    markers = (
        "UCLA COURSEWORK",
        "UCLA UNITS",
        "ACADEMIC RECORD",
        "MY DEGREE AUDIT",
        "DEGREE REQUIREMENT",
        "GRADED ATMPTD",
        "AUDIT PREPARED",
    )
    return any(m in u for m in markers)


def _extract_text_pymupdf_plain(pdf_path: str) -> str:
    import fitz

    doc = fitz.open(pdf_path)
    try:
        return "\n".join(page.get_text() for page in doc)
    finally:
        doc.close()


def _extract_text_pymupdf_ocr(pdf_path: str, dpi: int = 150) -> str:
    import fitz

    if not shutil.which("tesseract"):
        raise RuntimeError(
            "Tesseract is not installed. Some DARS PDFs (for example CollegeSource / "
            "MyUCLA exports) draw the audit as graphics with no text layer; Tesseract "
            "is required to OCR them. On macOS: brew install tesseract; on Debian/Ubuntu: "
            "apt install tesseract-ocr."
        )
    doc = fitz.open(pdf_path)
    try:
        parts = []
        for page in doc:
            tp = page.get_textpage_ocr(dpi=dpi, full=True)
            parts.append(page.get_text(textpage=tp))
        return "\n".join(parts)
    finally:
        doc.close()

# Reuse the department codes from the other scripts for consistency
DEPARTMENT_CODES = [
    "A&O SCI", "AERO ST", "AF AMER", "AF LANG", "AFRC ST", "AM IND", "AN N EA",
    "ANES", "ANTHRO", "APP CHEM", "APPLING", "ARABIC", "ARCH&UD", "ARCHEOL",
    "ARMENIA", "ART", "ART HIS", "ART&ARC", "ARTS ED", "ASIA AM", "ASIAN",
    "ASL", "ASTR", "BIOENGR", "BIOINFO", "BIOINFR", "BIOL CH", "BIOMATH",
    "BIOMATH", "BIOSTAT", "BMD RES", "BULGR", "C&EE", "C&EE ST", "C&S BIO",
    "CCAS", "CESC", "CH ENGR", "CHEM", "CHICANO", "CHIN", "CIVIC", "CLASSIC",
    "CLT HTG", "CLUSTER", "COM HLT", "COM LIT", "COM SCI", "COMM", "COMM ST",
    "COMPTNG", "CZCH", "DANCE", "DENT", "DESMA", "DGT HUM", "DIS STD",
    "DS BMED", "DUTCH", "EA STDS", "EC ENGR", "ECON", "EDUC", "EE BIOL",
    "EL ENGR", "ELTS", "ENGCOMP", "ENGL", "ENGR", "ENV HLT", "ENVIRON",
    "EPIDEM", "EPS SCI", "ESL", "ETHNMUS", "ETHNOMU", "FAM MED", "FIAT LX",
    "FILIPNO", "FILM TV", "FOOD ST", "FRNCH", "GE CLST", "GENDER", "GEOG",
    "GERMAN", "GJ STDS", "GLB HLT", "GLBL ST", "GRAD PD", "GREEK", "GRNTLGY",
    "HEBREW", "HIN-URD", "HIST", "HLT ADM", "HLT POL", "HNGAR", "HNRS",
    "HUM GEN", "I A STD", "I E STD", "I M STD", "IEP", "IL AMER", "INDO",
    "INF STD", "INTL DV", "IRANIAN", "ISLM ST", "ITALIAN", "JAPAN", "JEWISH",
    "KOREA", "LATIN", "LATN AM", "LAW", "LBR STD", "LBR&WS", "LGBTQS",
    "LGBTS", "LIFESCI", "LING", "LTHUAN", "M E STD", "M PHARM", "MAT SCI",
    "MATH", "MC&IP", "MCD BIO", "MECH&AE", "MED", "MED HIS", "MGMT",
    "MGMTEX", "MGMTFE", "MGMTFT", "MGMTGEX", "MGMTMFE", "MGMTMSA", "MGMTPHD",
    "MIA STD", "MIL SCI", "MIMG", "MOL BIO", "MOL TOX", "MOL TOX", "MSC HST",
    "MSC IND", "MUS HST", "MUS IND", "MUSC", "MUSCLG", "MUSCLGY", "MUSIC",
    "NAV SCI", "NEURBIO", "NEURLGY", "NEURO", "NEUROSC", "NEURSGY", "NONDEPT",
    "NR EAST", "NURSING", "OBGYN", "OPTH", "ORL BIO", "ORTHPDC", "PATH",
    "PBMED", "PEDS", "PHILOS", "PHYSCI", "PHYSICS", "PHYSIOL", "POL SCI",
    "POLSH", "PORTGSE", "PSYCH", "PSYCTRY", "PUB AFF", "PUB HLT", "PUB PLC",
    "QNT SCI", "RAD ONC", "RADIOL", "RE DEV", "RELIGN", "RES PRC", "ROMANIA",
    "RUSSN", "S ASIAN", "SCAND", "SCI EDU", "SEASIAN", "SEMITIC", "SLAVC",
    "SOC GEN", "SOC SC", "SOC THT", "SOC WLF", "SOCIOL", "SPAN", "SRB CRO",
    "STATS", "STATS", "SUMMER", "SURGERY", "SWAHILI", "THAI", "THEATER",
    "TURKIC", "UG-LAW", "UKRN", "UNIV ST", "URBN PL", "UROLOGY", "VIETMSE",
    "WL ARTS", "YIDDSH"
]

def extract_text_pdfminer(pdf_path: str) -> str:
    """
    Extract text from a DARS PDF.

    Most audits expose a normal text layer (pdfminer is enough). Some exports
    (notably certain CollegeSource viewers) render the audit as vector graphics,
    so only boilerplate on the last page is extractable; those need PyMuPDF OCR
    when Tesseract is installed.
    """
    text = extract_text(pdf_path)
    if _looks_like_usable_dars_text(text):
        save_text_to_file(text, "extracted.txt")
        return text

    try:
        plain = _extract_text_pymupdf_plain(pdf_path)
    except ImportError:
        plain = ""
    except Exception:
        plain = ""

    if _looks_like_usable_dars_text(plain):
        save_text_to_file(plain, "extracted.txt")
        return plain

    try:
        ocr = _extract_text_pymupdf_ocr(pdf_path)
    except ImportError as e:
        raise ValueError(
            "This PDF has little or no selectable text. Install the pymupdf package "
            "(and Tesseract for OCR), or re-export the audit from your browser using "
            "Print → Save as PDF."
        ) from e
    except RuntimeError as e:
        raise ValueError(str(e)) from e

    if _looks_like_usable_dars_text(ocr):
        save_text_to_file(ocr, "extracted.txt")
        return ocr

    raise ValueError(
        "Could not obtain readable DARS text from this PDF. Try re-exporting with "
        "Print → Save as PDF, or install Tesseract and pymupdf so image/vector-only "
        "audits can be OCR'd."
    )

def save_text_to_file(text: str, output_path: str):
    """Save text to a file."""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)

def extract_courses(dars_text):
    """
    Extract courses from DARS report.
    Returns list of tuples: (quarter, course_code)
    """
    courses = []
    
    # Check if "ACADEMIC RECORD UNIT TOTAL" section exists
    if "ACADEMIC RECORD UNIT TOTAL" in dars_text:
        # Extract from UCLA UNITS through ADVANCED PLACEMENT section
        start_idx = dars_text.find("UCLA UNITS")
        if start_idx == -1:
            start_idx = dars_text.find("UCLA COURSEWORK")
        
        if start_idx != -1:
            # Look for the next major section after these
            possible_ends = [
                "UCLA COURSEWORK",
                "LOWER DIVISION COURSES", 
                "GRADED UNIV CALIF",
                "LOWER DIVISION NON-UC TRANSFER UNITS"
            ]
            
            end_idx = len(dars_text)
            for end_marker in possible_ends:
                idx = dars_text.find(end_marker, start_idx + 10)
                if idx != -1:
                    end_idx = min(end_idx, idx)
            
            section_text = dars_text[start_idx:end_idx]
        else:
            section_text = ""
    else:
        # Fall back to UCLA COURSEWORK section
        start_idx = dars_text.find("UCLA COURSEWORK")
        if start_idx != -1:
            end_idx = dars_text.find("LOWER DIVISION COURSES", start_idx)
            if end_idx == -1:
                end_idx = len(dars_text)
            
            section_text = dars_text[start_idx:end_idx]
        else:
            return courses
    
    # Sort department codes by length (longest first) to match greedily
    sorted_dept_codes = sorted(DEPARTMENT_CODES, key=len, reverse=True)
    
    # Pattern to match course lines: QUARTER + rest of line
    course_pattern = r'^(FA|WI|SP|SU)(\d{2})\s+(.+)$'
    
    lines = section_text.split('\n')
    
    for line in lines:
        line = line.strip()
        match = re.match(course_pattern, line)
        if match:
            quarter_term = match.group(1)
            year = match.group(2)
            remainder = match.group(3).strip()
            
            dept = None
            course_num = None
            
            for dept_code in sorted_dept_codes:
                if remainder.startswith(dept_code):
                    dept = dept_code
                    course_num = remainder[len(dept_code):].strip()
                    break
            
            if dept and course_num:
                quarter = f"{quarter_term}{year}"
                course_code = f"{dept} {course_num}"
                courses.append((quarter, course_code))
    
    return courses

if __name__ == "__main__":
    import os
    
    filename = 'output_pdfminer.txt'
    if not os.path.exists(filename):
        print(f"File {filename} not found.")
    else:
        # Read the DARS text
        with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
            dars_text = f.read()

        # Extract courses
        courses = extract_courses(dars_text)

        # Print results
        print("Courses extracted:")
        print("-" * 50)
        for quarter, course_code in courses:
            print(f"{quarter}: {course_code}")

        print(f"\nTotal courses: {len(courses)}")
