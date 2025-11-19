from django.db import models

class CourseOfferings(models.Model):
    id = models.BigAutoField(primary_key=True)
    course_id = models.IntegerField(max_length=8)
    term = models.CharField(max_length=16)
    section = models.CharField(max_length=256)
    instructor = models.TextField()
    meeting_times = models.CharField(max_length=4)
    location = models.TextField()
    enrollment_status = models.TextField()
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)
    
    class Meta:
        db_table = "course_offerings"     # EXACT table name in Supabase
        managed = False                 # DON'T let Django try to create or migrate this table