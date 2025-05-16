-- Add a new nullable text column to store the name of the competence when 'specific_competence' is 'Alta' (Other)
ALTER TABLE resources ADD COLUMN specific_competence_text TEXT NULL;
