from django.db import models

class Subject(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=64)
    name = models.CharField(max_length=256)
    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    class Meta:
        db_table = "subject_areas"     # EXACT table name in Supabase
        managed = False                 # DON'T let Django try to create or migrate this table

        