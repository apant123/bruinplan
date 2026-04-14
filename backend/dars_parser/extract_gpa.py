import re

def extract_gpa_from_dars(dars_text):
    """
    Extracts the overall cumulative GPA from the DARS text.
    Targets the "GRADED UNIV CALIF (UC) UNITS" section which contains
    the true cumulative GPA, rather than section-specific GPAs.
    """
    # Best match: the cumulative GPA from "GRADED UNIV CALIF" section
    # e.g. "GRADED UNIV CALIF (UC) UNITS - MINIMUM 2.0 GPA ... 439.4 POINTS  3.631 GPA"
    graded_uc_idx = dars_text.find("GRADED UNIV CALIF")
    if graded_uc_idx != -1:
        # Search in the block after this header for POINTS ... GPA
        # Start a bit after the header to skip "MINIMUM 2.0 GPA" in the title
        block = dars_text[graded_uc_idx + 50:graded_uc_idx + 500]
        match = re.search(r'POINTS\s+([\d.]+)\s+GPA', block)
        if match:
            return float(match.group(1))
        # Look for standalone GPA value (not "MINIMUM X.X GPA")
        match = re.search(r'(?<!MINIMUM\s)(\d+\.\d{2,})\s+GPA', block)
        if match:
            return float(match.group(1))

    # Second best: "CUMULATIVE GPA" section
    cum_idx = dars_text.find("CUMULATIVE GPA")
    if cum_idx != -1:
        block = dars_text[cum_idx:cum_idx + 500]
        match = re.search(r'POINTS\s+([\d.]+)\s+GPA', block)
        if match:
            return float(match.group(1))
        match = re.search(r'(\d+\.\d+)\s+GPA', block)
        if match:
            return float(match.group(1))

    # Fallback: find the last POINTS ... GPA in the document (most likely cumulative)
    matches = re.findall(r'POINTS\s+([\d.]+)\s+GPA', dars_text)
    if matches:
        return float(matches[-1])

    # Last resort: last X.XXX GPA in the document
    matches = re.findall(r'(\d+\.\d+)\s+GPA', dars_text)
    if matches:
        return float(matches[-1])
        
    return None
