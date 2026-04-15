import re

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


def _normalize_course_line(line: str) -> str:
    """Fix common PDF/OCR artifacts in quarter and department fragments."""
    s = line.strip()
    if not s:
        return s
    # Summer sometimes OCR'd as $U24
    m = re.match(r"^[\$]U(\d{2})$", s, re.IGNORECASE)
    if m:
        return f"SU{m.group(1).upper()}"
    # FA23_ENGCOMP -> FA23 ENGCOMP
    s = re.sub(r"^(FA|WI|SP|SU)(\d{2})_", r"\1\2 ", s)
    return s.strip()


def _remainder_looks_like_catalog_number(remainder: str) -> bool:
    """Reject OCR title lines and headers mistaken for catalog numbers (e.g. SUMMER 2024)."""
    if not remainder:
        return False
    tok = remainder.split()[0].upper()
    if len(tok) > 12 or any(c in tok for c in "&/(),;"):
        return False
    if not any(c.isdigit() for c in tok):
        return False
    if re.match(r"^(19|20)\d{2}$", tok):
        return False
    # UCLA-style: 31B, 3D, M148, 100A, 48CW, 314
    return bool(re.match(r"^[A-Z]?\d{1,4}[A-Z]*$", tok))


def _split_dept_remainder(line: str, sorted_dept_codes: list) -> tuple:
    """
    Match a department code at the start of line, including OCR cases where
    spaces inside the code are missing (e.g. COMSCI31 -> COM SCI + 31).
    """
    if not line:
        return None, None
    for dept_code in sorted_dept_codes:
        if dept_code == "SUMMER":
            # "SUMMER" is a subject code but OCR'd section headers also start with SUMMER.
            continue
        if line.startswith(dept_code):
            rem = line[len(dept_code) :].strip()
            if rem:
                return dept_code, rem
        compact = dept_code.replace(" ", "")
        if compact and line.startswith(compact):
            rem = line[len(compact) :].strip()
            if rem:
                return dept_code, rem
    return None, None


def extract_taken_courses(dars_text: str):
    """
    Extract courses from DARS report text.
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
            # Find the end - look for "UCLA COURSEWORK" or similar major section
            # We want to include:
            # - UCLA UNITS
            # - LOWER DIVISION NON-UC TRANSFER UNITS
            # - ADVANCED PLACEMENT / INTERNATIONAL BACCALAUREATE / GCE
            
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
    # This ensures "COM SCI" is matched before "COM"
    sorted_dept_codes = sorted(DEPARTMENT_CODES, key=len, reverse=True)

    # Quarter on same line as department, or alone on previous line (vector/OCR PDFs)
    combined_pattern = re.compile(r"^(FA|WI|SP|SU)(\d{2})\s+(.+)$")
    quarter_only_pattern = re.compile(r"^(FA|WI|SP|SU)(\d{2})$")

    lines = section_text.split("\n")
    pending_quarter = None

    for raw_line in lines:
        line = _normalize_course_line(raw_line)
        if not line:
            continue

        match_combined = combined_pattern.match(line)
        if match_combined:
            quarter_term = match_combined.group(1)
            year = match_combined.group(2)
            remainder = match_combined.group(3).strip()
            dept, course_num = _split_dept_remainder(remainder, sorted_dept_codes)
            if (
                dept
                and course_num
                and _remainder_looks_like_catalog_number(course_num)
            ):
                quarter = f"{quarter_term}{year}"
                courses.append((quarter, f"{dept} {course_num}"))
                pending_quarter = quarter
            continue

        match_q = quarter_only_pattern.match(line)
        if match_q:
            pending_quarter = f"{match_q.group(1)}{match_q.group(2)}"
            continue

        if pending_quarter:
            dept, course_num = _split_dept_remainder(line, sorted_dept_codes)
            if (
                dept
                and course_num
                and _remainder_looks_like_catalog_number(course_num)
            ):
                courses.append((pending_quarter, f"{dept} {course_num}"))

    return courses

def extract_courses_from_file(filepath='output_pdfminer.txt'):
    """
    Extract courses from DARS report file.
    Returns list of tuples: (quarter, course_code)
    """
    # Read the file
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        dars_text = f.read()
    
    return extract_taken_courses(dars_text)


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract courses from DARS report')
    parser.add_argument('filepath', nargs='?', default='output_pdfminer.txt',
                        help='Path to DARS text file (default: output_pdfminer.txt)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    args = parser.parse_args()
    
    # Extract courses
    courses = extract_courses_from_file(args.filepath)
    
    if args.json:
        import json
        print(json.dumps({'taken_courses': [{'quarter': q, 'course': c} for q, c in courses]}, indent=2))
    else:
        # Print results
        print("Courses extracted:")
        print("-" * 50)
        for quarter, course_code in courses:
            print(f"{quarter}: {course_code}")
        
        print(f"\nTotal courses: {len(courses)}")