from django.db import models

class Plan(models.Model):
    id = models.BigAutoField(primary_key=True)

    user_id = models.UUIDField(db_index=True)

    name = models.CharField(max_length=256)

    start_year = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = "plans"     # EXACT table name in Supabase
        managed = False                 # DON'T let Django try to create or migrate this table



class PlanItem(models.Model):
    
    class Term(models.TextChoices):
        FALL = "FALL", "Fall"
        WINTER = "WINTER", "Winter"
        SPRING = "SPRING", "Spring"
        SUMMER_A = "SUMMER_A", "Summer A"
        SUMMER_C = "SUMMER_C", "Summer C"

    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        ENROLLED = "enrolled", "Enrolled"
        COMPLETED = "completed", "Completed"
        DROPPED = "dropped", "Dropped"

    id = models.BigAutoField(primary_key=True)

    plan = models.ForeignKey(
        Plan,
        on_delete=models.CASCADE,
        db_column="plan_id",
        related_name="items",
    )

    year_index = models.IntegerField()  
    term = models.CharField(max_length=16, choices=Term.choices)

    
    
    course_id = models.BigIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PLANNED)
    position = models.IntegerField(default=0)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "plan_items"
        managed = False

        
        constraints = [
            models.UniqueConstraint(
                fields=["plan", "year_index", "term", "course_id"],
                name="uniq_plan_year_term_course",
            ),
        ]
        indexes = [
            models.Index(fields=["plan", "year_index", "term"], name="idx_plan_cell"),
            models.Index(fields=["plan"], name="idx_plan"),
        ]
