import os, django, json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from api.models import Course
print("Sample Courses:")
for c in Course.objects.exclude(requisites_parsed__isnull=True).exclude(requisites_parsed='{}').exclude(requisites_parsed='[]')[:5]:
    print(c.subject_area_id, c.number, json.dumps(c.requisites_parsed))
