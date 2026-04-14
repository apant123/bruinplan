import re

def clean_program_name(name):
    """
    Cleans up the program name from a DARS audit.
    Removes the major/minor codes (e.g. 'LS0179', 'MM 29')
    and fixes typical PDF splitting artifacts.
    """
    # Remove leading specific codes. Only strip if it contains a digit! (e.g. LS0179, MM29, SC-LS0179)
    name = re.sub(r'^[A-Z-]*\d+[A-Z0-9-]*\s+', '', name)
    # Also handle things like "MM 29 " -> prefix letters, space, digits, space
    name = re.sub(r'^[A-Z]+\s+\d+\s+', '', name)
    
    # Fix common artifacts and word splits from PDF parsing
    name = name.replace("SU MMER", "SUMMER")
    name = name.replace("HU MANITIES", "HUMANITIES")
    name = name.replace("CO MPUTING", "COMPUTING")
    
    # Clean trailing tags
    name = name.replace(" MINO R", "")
    name = name.replace(" MINOR", "")
    
    # Clean trailing degree specifications
    name = name.replace(" B.S.", "").replace(" B.S", "")
    name = name.replace(" B.A.", "").replace(" B.A", "")
    name = name.replace(" B.F.A.", "").replace(" B.F.A", "")
    name = name.replace(" B.M.", "").replace(" B.M", "")
    return name.strip().title()


def extract_expected_graduation(dars_text):
    """
    Extracts the expected graduation quarter and year.
    Returns (year, quarter) or (None, None).
    """
    # Normalize spaces without removing text
    normal_text = " ".join(dars_text.split())
    
    match = re.search(r'Degree Expected Term\s*(\d{4})\s+(SPRING|SUMMER|FALL|WINTER)', normal_text)
    if match:
        year = int(match.group(1))
        quarter = match.group(2).capitalize()
        return year, quarter
    return None, None


def get_programs(dars_text):
    """
    Analyzes the text layout to find the major and minor, handling both standard
    inline formats and broken columnar PDF formats.
    Returns (major, minor).
    """
    normal_text = " ".join(dars_text.split())
    normal_text = normal_text.replace("MAJ O R1", "MAJOR1").replace("MAJO R1", "MAJOR1")
    normal_text = normal_text.replace("MINO R1", "MINOR1")
    
    # Let's print the head of the dars text to the terminal for debugging
    print("----- DARS RAW TEXT START -----")
    print(dars_text[:1200])
    print("----- DARS RAW TEXT END -----")
    print("----- DARS NORMAL TEXT START -----")
    idx = normal_text.find("MAJOR1")
    print(normal_text[idx:idx+400] if idx != -1 else normal_text[:400])
    print("----- DARS NORMAL TEXT END -----")

    major = None
    minor = None

    # First attempt: Columar parsing which relies on "Description" header
    # Very common in PDFMiner output
    # Stop at SPECIALIZATION, '-->', or 'Audit Results' to avoid capturing the entire document
    desc_match = re.search(r'Description\s+(.*?)(?:SPECIALIZATION|-->|Audit Results)', normal_text, re.IGNORECASE)
    if desc_match:
        desc_block = desc_match.group(1).strip()
        # Find combination of Major and Minor. Usually major ends with B.S or B.A
        split_match = re.search(r'(.*?(?:B\.S\.|B\.A\.|B\.S|B\.A|B\.F\.A|B\.F\.A\.|B\.M\.|B\.M))\s*(.*)', desc_block)
        if split_match:
            raw_major = split_match.group(1)
            raw_minor = split_match.group(2)
            major = clean_program_name(raw_major)
            if raw_minor:
                minor = clean_program_name(raw_minor)
        else:
            # If we don't detect a degree tag, just assign all to major
            major = clean_program_name(desc_block)

    # Second attempt: If columnar failed, try standard inline parsing
    if not major:
        match_major = re.search(r'MAJOR1(?:\s+\d{4}\s+[A-Z]+)?\s*(.*?)(?:MINOR1|SPECIALIZATION|$)', normal_text)
        if match_major:
            major = clean_program_name(match_major.group(1))

        match_minor = re.search(r'MINOR1(?:\s+\d{4}\s+[A-Z]+)?\s*(.*?)(?:SPECIALIZATION|MAJOR|$)', normal_text)
        if match_minor:
            minor = clean_program_name(match_minor.group(1))

    # Strip empty minor if it exists
    if minor and not minor.strip():
        minor = None

    return major, minor

def extract_major(dars_text):
    return get_programs(dars_text)[0]


def extract_minor(dars_text):
    return get_programs(dars_text)[1]
