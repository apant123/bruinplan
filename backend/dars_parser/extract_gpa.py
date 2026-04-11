import re

def extract_gpa_from_dars(dars_text):
    """
    Extracts the overall GPA from the DARS text.
    Looks for patterns like 'POINTS 3.837 GPA' or similar occurrences of GPA at the end of the transcript.
    """
    # Look for a number followed by GPA at the end of the text. E.g., "598.5 POINTS 3.837 GPA"
    # Or just search for all numeric GPAs and typically the last one or the one with 'POINTS' is the overall.
    
    # Try looking for the exact phrase indicating GPA from graded units
    match = re.search(r'POINTS\s+([\d.]+)\s+GPA', dars_text)
    if match:
        return float(match.group(1))
    
    # Fallback to finding the last occurrence of something like '3.837 GPA'
    matches = re.findall(r'(\d+\.\d+)\s+GPA', dars_text)
    if matches:
        return float(matches[-1])
        
    return None
