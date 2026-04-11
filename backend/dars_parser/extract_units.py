import re

def extract_total_units_from_dars(dars_text):
    """
    Extracts the total units from the DARS text.
    Looks for the units immediately preceding the 'GRADED ATMPTD UNITS' section.
    """
    idx = dars_text.rfind('GRADED ATMPTD UNITS')
    if idx != -1:
        # Search backwards from this instance for the previous "UNITS"
        block = dars_text[max(0, idx - 150):idx]
        matches = re.findall(r'([\d.]+)\s*UNITS', block)
        if matches:
            return float(matches[-1])

    # Fallback
    matches = re.findall(r'([\d.]+)\s*UNITS', dars_text)
    if matches:
        return float(matches[-1])
    return None
