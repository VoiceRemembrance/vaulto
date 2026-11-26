-- Reverse only after confirming values stored in these columns can be discarded.
ALTER TABLE transactions DROP COLUMN payment_method;
ALTER TABLE transactions DROP COLUMN note;
