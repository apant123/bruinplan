import os
import sys
import csv
import json
import django
from django.db import connection

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Course, Subject, GradeDistribution

def get_term_label(term_code):
    term_code = str(term_code).strip()
    mapping = {
        '242': 'Summer 24 Session C'
    }
    if term_code in mapping:
        return mapping[term_code]
        
    if len(term_code) == 3:
        year = term_code[:2]
        term = term_code[2]
        term_map = {
            'F': 'Fall',
            'W': 'Winter',
            'S': 'Spring',
            '1': 'Summer',
            '2': 'Summer Session C'
        }
        if term in term_map:
            return f"{term_map[term]} {year}"
    return term_code

def main():
    print("Setting up Grade Distributions table...")
    # SQL to create the table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS grade_distributions (
        id BIGSERIAL PRIMARY KEY,
        course_id BIGINT,
        course_label TEXT,
        subject_code TEXT,
        course_number TEXT,
        term TEXT,
        instructor TEXT,
        grades_json JSONB,
        total_enrolled INTEGER
    );
    """
    with connection.cursor() as cursor:
        cursor.execute(create_table_sql)
    print("Table ensured!")
    
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    else:
        csv_file = os.path.join(os.path.dirname(__file__), '../../Responsive Documents (25-5881).xlsx - Sheet1.csv')
    
    if not os.path.exists(csv_file):
        print(f"File not found: {csv_file}")
        return

    # Preload Subjects
    # Map code -> id
    subject_map = {}
    for s in Subject.objects.all():
        code = s.code.strip().upper()
        # Some subjects have multiple spaces, let's normalize
        code_norm = ' '.join(code.split())
        subject_map[code_norm] = s.id

    # Preload Courses
    # Map (subject_id, number_norm) -> course_id
    course_map = {}
    for c in Course.objects.all():
        num_norm = str(c.number).strip().upper()
        course_map[(c.subject_area_id, num_norm)] = c.id

    distributions = {} # key: (term, subj_code, catalog_no, instructor), val: dict of {"grades": {}, "enrolled": 0}
    
    print("Parsing CSV...")
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            term_code = row.get('enrl_term_cd') or row.get('ENROLLMENT TERM') or ''
            term_label = get_term_label(term_code)
            
            subj_cd = (row.get('subj_area_cd') or row.get('SUBJECT AREA') or '').strip().upper()
            subj_cd_norm = ' '.join(subj_cd.split())
            cat_no = (row.get('disp_catlg_no') or row.get('CATLG NBR') or '').strip().upper()
            
            instructor = (row.get('instr_nm') or row.get('INSTR NAME') or '').strip()
            
            grade = (row.get('grd_cd') or row.get('GRD OFF') or '').strip()
            num_grd = (row.get('num_grd') or row.get('GRD COUNT') or '0').strip()
            num_grd = int(num_grd) if num_grd.isdigit() else 0
            
            enrl_tot = (row.get('enrl_tot') or row.get('ENRL TOT') or '0').strip()
            enrl_tot = int(enrl_tot) if enrl_tot.isdigit() else 0
            
            key = (term_label, subj_cd_norm, cat_no, instructor)
            
            if key not in distributions:
                distributions[key] = {
                    "grades": {},
                    "enrolled": enrl_tot
                }
            
            distributions[key]["grades"][grade] = distributions[key]["grades"].get(grade, 0) + num_grd
            if enrl_tot > distributions[key]["enrolled"]:
                distributions[key]["enrolled"] = enrl_tot
                
    print(f"Aggregated {len(distributions)} unique course offerings.")
    
    print("Inserting into database (Appending)...")
    objects_to_create = []
    
    for key, data in distributions.items():
        term_label, subj_cd_norm, cat_no, instructor = key
        
        subj_id = subject_map.get(subj_cd_norm)
        course_id = None
        if subj_id:
            course_id = course_map.get((subj_id, cat_no))
            
        course_label = f"{subj_cd_norm} {cat_no}"
        
        obj = GradeDistribution(
            course_id=course_id,
            course_label=course_label,
            subject_code=subj_cd_norm,
            course_number=cat_no,
            term=term_label,
            instructor=instructor,
            grades_json=data["grades"],
            total_enrolled=data["enrolled"]
        )
        objects_to_create.append(obj)
    
    # Bulk create
    GradeDistribution.objects.bulk_create(objects_to_create, batch_size=1000)
    print("Done! Inserted", len(objects_to_create), "records.")

if __name__ == '__main__':
    main()
