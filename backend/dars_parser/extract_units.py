import re

def extract_total_units_from_dars(dars_text):
    """
    Extracts the total earned units from the DARS text.
    Targets the "GRADED UNIV CALIF (UC) UNITS" section which has the
    true earned unit count, rather than section-specific or in-progress units.
    """
    # Best match: "GRADED UNIV CALIF (UC) UNITS" section
    # Look for "Earned: XXX.X UNITS" in this section
    graded_uc_idx = dars_text.find("GRADED UNIV CALIF")
    if graded_uc_idx != -1:
        # Look backwards a bit and forward to find the Earned units
        block = dars_text[max(0, graded_uc_idx - 300):graded_uc_idx + 300]
        # Look for "Earned:" followed by units
        match = re.search(r'Earned:\s*([\d.]+)\s*UNITS', block)
        if match:
            return float(match.group(1))

    # Second best: "UNIT CHECK - TOTAL UNITS" or "ACADEMIC RECORD UNIT TOTAL"
    for marker in ["UNIT CHECK - TOTAL UNITS", "ACADEMIC RECORD UNIT TOTAL"]:
        idx = dars_text.find(marker)
        if idx != -1:
            block = dars_text[idx:idx + 300]
            # Look for "Earned:" or just a number before UNITS
            match = re.search(r'Earned:\s*([\d.]+)\s*UNITS', block)
            if match:
                return float(match.group(1))
            match = re.search(r'([\d.]+)\s*UNITS', block)
            if match:
                return float(match.group(1))

    # Fallback: look for the last "Earned: XXX UNITS" in the document
    matches = re.findall(r'Earned:\s*([\d.]+)\s*UNITS', dars_text)
    if matches:
        return float(matches[-1])

    # Last resort
    matches = re.findall(r'([\d.]+)\s*UNITS', dars_text)
    if matches:
        return float(matches[-1])
    return None
