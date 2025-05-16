CREATE TABLE resource_competency (
    id BIGSERIAL PRIMARY KEY,
    resource_id uuid NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    competency_id integer NOT NULL REFERENCES specific_competencies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


INSERT INTO resource_competency (resource_id, competency_id)
SELECT id AS resource_id, specific_competency_id
FROM resources
WHERE specific_competency_id IS NOT NULL;

ALTER TABLE resource_competency
ADD CONSTRAINT unique_resource_competency UNIQUE (resource_id, competency_id);