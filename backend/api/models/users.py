from django.db import models
import uuid


class User(models.Model):
    id = models.UUIDField(primary_key=True, db_column="uuid", default=uuid.uuid4, editable=False)

    email = models.TextField(null=True)
    password_hash = models.TextField(null=True)

    created_at = models.DateTimeField(null=True)
    updated_at = models.DateTimeField(null=True)

    auth_provider = models.TextField(null=True)  # store string ('google', 'password')

    class Meta:
        db_table = "users"      # EXACT Supabase table name
        managed = False         # Django won't create/migrate this table

class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.TextField(null=True)
    major = models.TextField(null=True)
    minor = models.TextField(null=True)

    expected_grad = models.TextField(null=True)
    year = models.IntegerField(null=True)

    completed_lower_div_units = models.IntegerField(null=True)
    completed_upper_div_units = models.IntegerField(null=True)

    gpa = models.DecimalField(max_digits=4, decimal_places=2, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    classes_taken = models.JSONField(null=True)
    classes_needed = models.JSONField(null=True)

    class Meta:
        db_table = "user_profiles"
        managed = False              
    