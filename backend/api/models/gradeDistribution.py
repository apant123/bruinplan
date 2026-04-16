from django.db import models

class GradeDistribution(models.Model):
    id = models.BigAutoField(primary_key=True)
    course_id = models.IntegerField(null=True, blank=True)
    course_label = models.CharField(max_length=256, null=True, blank=True)
    subject_code = models.CharField(max_length=64, null=True, blank=True)
    course_number = models.CharField(max_length=64, null=True, blank=True)
    term = models.CharField(max_length=64)
    instructor = models.CharField(max_length=256, null=True)
    grades_json = models.JSONField()
    total_enrolled = models.IntegerField()

    class Meta:
        db_table = "grade_distributions"     # EXACT table name in Supabase
        managed = False                 # DON'T let Django try to create or migrate this table
