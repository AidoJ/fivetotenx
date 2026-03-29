UPDATE straight_talk_responses 
SET responses = (
  SELECT jsonb_object_agg(key, value) 
  FROM jsonb_each_text(responses) 
  WHERE value != 'not_found' 
    AND lower(value) NOT LIKE '%[no audible response]%'
    AND trim(value) != ''
),
completed = false,
updated_at = now()
WHERE id = '774ea70c-78c0-4fa0-95a0-cb3b8fd46d21';