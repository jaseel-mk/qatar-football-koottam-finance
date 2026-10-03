-- Run after matchday-formation-schema.sql in the formation database.

-- Idempotent: existing named templates and coordinates are preserved.

BEGIN;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '5-a-side — 2-1-1', '2-1-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='5-a-side — 2-1-1' AND code='2-1-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'CM', 'CM', 50, 44, 3),
(formation_id, 'ST', 'ST', 50, 20, 4);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '5-a-side — 1-2-1', '1-2-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='5-a-side — 1-2-1' AND code='1-2-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'CB', 'CB', 50, 68, 1),
(formation_id, 'CM', 'CM', 20.0, 44, 2),
(formation_id, 'CM', 'CM', 80.0, 44, 3),
(formation_id, 'ST', 'ST', 50, 20, 4);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '5-a-side — 2-2', '2-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='5-a-side — 2-2' AND code='2-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 66, 1),
(formation_id, 'RB', 'RB', 80.0, 66, 2),
(formation_id, 'ST', 'ST', 20.0, 25, 3),
(formation_id, 'ST', 'ST', 80.0, 25, 4);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '5-a-side — 1-3', '1-3', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='5-a-side — 1-3' AND code='1-3')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'CB', 'CB', 50, 66, 1),
(formation_id, 'LW', 'LW', 20.0, 25, 2),
(formation_id, 'ST', 'ST', 50.0, 25, 3),
(formation_id, 'RW', 'RW', 80.0, 25, 4);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '6-a-side — 2-2-1', '2-2-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='6-a-side — 2-2-1' AND code='2-2-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'CM', 'CM', 20.0, 44, 3),
(formation_id, 'CM', 'CM', 80.0, 44, 4),
(formation_id, 'ST', 'ST', 50, 20, 5);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '6-a-side — 1-3-1', '1-3-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='6-a-side — 1-3-1' AND code='1-3-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'CB', 'CB', 50, 68, 1),
(formation_id, 'LM', 'LM', 20.0, 44, 2),
(formation_id, 'CM', 'CM', 50.0, 44, 3),
(formation_id, 'RM', 'RM', 80.0, 44, 4),
(formation_id, 'ST', 'ST', 50, 20, 5);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '6-a-side — 2-1-2', '2-1-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='6-a-side — 2-1-2' AND code='2-1-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'CM', 'CM', 50, 44, 3),
(formation_id, 'ST', 'ST', 20.0, 20, 4),
(formation_id, 'ST', 'ST', 80.0, 20, 5);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '6-a-side — 3-1-1', '3-1-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='6-a-side — 3-1-1' AND code='3-1-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'CB', 'CB', 50.0, 68, 2),
(formation_id, 'RB', 'RB', 80.0, 68, 3),
(formation_id, 'CM', 'CM', 50, 44, 4),
(formation_id, 'ST', 'ST', 50, 20, 5);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '7-a-side — 2-3-1', '2-3-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='7-a-side — 2-3-1' AND code='2-3-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'LM', 'LM', 20.0, 44, 3),
(formation_id, 'CM', 'CM', 50.0, 44, 4),
(formation_id, 'RM', 'RM', 80.0, 44, 5),
(formation_id, 'ST', 'ST', 50, 20, 6);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '7-a-side — 3-2-1', '3-2-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='7-a-side — 3-2-1' AND code='3-2-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'CB', 'CB', 50.0, 68, 2),
(formation_id, 'RB', 'RB', 80.0, 68, 3),
(formation_id, 'CM', 'CM', 20.0, 44, 4),
(formation_id, 'CM', 'CM', 80.0, 44, 5),
(formation_id, 'ST', 'ST', 50, 20, 6);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '7-a-side — 2-2-2', '2-2-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='7-a-side — 2-2-2' AND code='2-2-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'CM', 'CM', 20.0, 44, 3),
(formation_id, 'CM', 'CM', 80.0, 44, 4),
(formation_id, 'ST', 'ST', 20.0, 20, 5),
(formation_id, 'ST', 'ST', 80.0, 20, 6);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '7-a-side — 3-1-2', '3-1-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='7-a-side — 3-1-2' AND code='3-1-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'CB', 'CB', 50.0, 68, 2),
(formation_id, 'RB', 'RB', 80.0, 68, 3),
(formation_id, 'CM', 'CM', 50, 44, 4),
(formation_id, 'ST', 'ST', 20.0, 20, 5),
(formation_id, 'ST', 'ST', 80.0, 20, 6);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '8-a-side — 3-3-1', '3-3-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='8-a-side — 3-3-1' AND code='3-3-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'CB', 'CB', 50.0, 68, 2),
(formation_id, 'RB', 'RB', 80.0, 68, 3),
(formation_id, 'LM', 'LM', 20.0, 44, 4),
(formation_id, 'CM', 'CM', 50.0, 44, 5),
(formation_id, 'RM', 'RM', 80.0, 44, 6),
(formation_id, 'ST', 'ST', 50, 20, 7);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '8-a-side — 2-3-2', '2-3-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='8-a-side — 2-3-2' AND code='2-3-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'LM', 'LM', 20.0, 44, 3),
(formation_id, 'CM', 'CM', 50.0, 44, 4),
(formation_id, 'RM', 'RM', 80.0, 44, 5),
(formation_id, 'ST', 'ST', 20.0, 20, 6),
(formation_id, 'ST', 'ST', 80.0, 20, 7);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '8-a-side — 3-2-2', '3-2-2', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='8-a-side — 3-2-2' AND code='3-2-2')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'CB', 'CB', 50.0, 68, 2),
(formation_id, 'RB', 'RB', 80.0, 68, 3),
(formation_id, 'CM', 'CM', 20.0, 44, 4),
(formation_id, 'CM', 'CM', 80.0, 44, 5),
(formation_id, 'ST', 'ST', 20.0, 20, 6),
(formation_id, 'ST', 'ST', 80.0, 20, 7);
 END IF;
END $$;

DO $$ DECLARE formation_id uuid; BEGIN
 INSERT INTO public.qfk_saved_formations(name, code, is_active)
 SELECT '8-a-side — 2-4-1', '2-4-1', true
 WHERE NOT EXISTS (SELECT 1 FROM public.qfk_saved_formations WHERE name='8-a-side — 2-4-1' AND code='2-4-1')
 RETURNING id INTO formation_id;
 IF formation_id IS NOT NULL THEN
 INSERT INTO public.qfk_formation_positions(formation_id,position_code,label,x,y,display_order) VALUES
 (formation_id, 'GK', 'GK', 50, 90, 0),
(formation_id, 'LB', 'LB', 20.0, 68, 1),
(formation_id, 'RB', 'RB', 80.0, 68, 2),
(formation_id, 'LM', 'LM', 20.0, 44, 3),
(formation_id, 'CM', 'CM', 40.0, 44, 4),
(formation_id, 'CM', 'CM', 60.0, 44, 5),
(formation_id, 'RM', 'RM', 80.0, 44, 6),
(formation_id, 'ST', 'ST', 50, 20, 7);
 END IF;
END $$;

COMMIT;
