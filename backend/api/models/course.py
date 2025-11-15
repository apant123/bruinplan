from django.db import models

class Course(models.Model):
    id = models.BigAutoField(primary_key=True)
    subject_area_id = models.IntegerField(max_length=8)
    number = models.CharField(max_length=16)
    title = models.CharField(max_length=256)
    description = models.TextField()
    units = models.CharField(max_length=4)
    requisites_text = models.TextField()
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)
    requisites_parsed = models.JSONField(null=True)
    
    class Meta:
        db_table = "courses"     # EXACT table name in Supabase
        managed = False                 # DON'T let Django try to create or migrate this table