INSERT INTO services (id,name,description,image,duration_minutes,price_cents,active,sort_order) VALUES
('fibra','Alongamento em fibra de vidro','Alongamento com estrutura em fibra de vidro.','/images/francesinha.webp',60,15000,1,0),
('gel','Alongamento em gel','Alongamento e acabamento em gel.','/images/rosa.webp',50,13000,1,1),
('esmalte-gel','Esmaltação em gel','Cor e brilho com esmaltação em gel.','/images/rosa.webp',30,6000,1,2),
('blindagem','Blindagem e esmaltação em gel','Proteção da unha natural com esmaltação em gel.','/images/preto.webp',60,9000,1,3),
('cutilagem','Cutilagem e esmaltação comum','Cuidado das cutículas e esmaltação tradicional.','/images/colorido.webp',50,4500,1,4)
ON CONFLICT(id) DO UPDATE SET duration_minutes=excluded.duration_minutes,price_cents=excluded.price_cents;
--> statement-breakpoint
INSERT INTO settings (key,value) VALUES ('demo_price_cents','{"fibra":15000,"gel":13000,"esmalte-gel":6000,"blindagem":9000,"cutilagem":4500}')
ON CONFLICT(key) DO UPDATE SET value=excluded.value;
