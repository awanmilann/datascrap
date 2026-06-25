-- ============================================================================
-- DataHarvest - Seed Data
-- ============================================================================
-- Demo seed data for local development and testing.
-- Uses fixed UUIDs so references are stable across runs.
-- Run only after all migrations have been applied.
-- ============================================================================

-- ============================================================================
-- 1. Demo Users (auth.users)
-- ============================================================================
-- We insert directly into auth.users so Supabase Auth recognises them.
-- Passwords are bcrypt-hashed via pgcrypto's crypt()/gen_salt().
INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, confirmation_sent_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token,
    aud, role
)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'demo@dataharvest.io',
    crypt('demo123', gen_salt('bf')),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo User"}',
    NOW(), NOW(),
    '', '', '', '',
    'authenticated', 'authenticated'
),
(
    'a0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'admin@dataharvest.io',
    crypt('admin123', gen_salt('bf')),
    NOW(), NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin DataHarvest"}',
    NOW(), NOW(),
    '', '', '', '',
    'authenticated', 'authenticated'
);

-- ============================================================================
-- 2. Profiles
-- ============================================================================
-- Profiles.id references auth.users.id and is populated via trigger in
-- production, but for seed data we insert directly.
INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Demo User',
    'demo@dataharvest.io',
    'user',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '7 days'
),
(
    'a0000000-0000-0000-0000-000000000002',
    'Admin DataHarvest',
    'admin@dataharvest.io',
    'admin',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '7 days'
);

-- ============================================================================
-- 3. User Consents
-- ============================================================================
INSERT INTO public.user_consents (id, user_id, consent_text, consent_version, consent_at, created_at)
VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'I agree to the DataHarvest Terms of Service and Privacy Policy for web scraping activities.',
    '1.0',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'I agree to the updated DataHarvest Terms of Service and Privacy Policy v1.1.',
    '1.1',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'I agree to the DataHarvest Terms of Service and Privacy Policy for web scraping activities.',
    '1.0',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
);

-- ============================================================================
-- 4. Projects
-- ============================================================================
INSERT INTO public.projects (id, user_id, name, description, data_type, status, created_at, updated_at)
VALUES
(
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Katalog Elektronik',
    'Scraping data produk elektronik dari berbagai toko online untuk katalog harga dan spesifikasi.',
    'product',
    'active',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
),
(
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Berita Teknologi',
    'Mengumpulkan artikel berita teknologi terbaru dari portal berita Indonesia.',
    'article',
    'active',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 hours'
),
(
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Direktori Startup',
    'Membangun direktori startup Indonesia dengan informasi pendiri, pendanaan, dan sektor.',
    'business',
    'active',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
);

-- ============================================================================
-- 5. Project URLs
-- ============================================================================
INSERT INTO public.project_urls (id, project_id, url, domain, is_active, robots_allowed, robots_checked_at, created_at, updated_at)
VALUES
(
    'u0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'https://books.toscrape.com',
    'books.toscrape.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
),
(
    'u0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    'https://example.com/products',
    'example.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '1 day'
),
(
    'u0000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000002',
    'https://example.com/news/tech',
    'example.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 hours'
),
(
    'u0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000002',
    'https://example.com/articles',
    'example.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '2 hours'
),
(
    'u0000000-0000-0000-0000-000000000005',
    'p0000000-0000-0000-0000-000000000003',
    'https://example.com/startups',
    'example.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
),
(
    'u0000000-0000-0000-0000-000000000006',
    'p0000000-0000-0000-0000-000000000003',
    'https://example.com/directory',
    'example.com',
    TRUE,
    TRUE,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day'
);

-- ============================================================================
-- 6. Scrape Jobs
-- ============================================================================
INSERT INTO public.scrape_jobs (id, project_id, user_id, status, total_urls, processed_urls, total_items, started_at, completed_at, error_message, rejection_reason, created_at, updated_at)
VALUES
(
    'j0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'completed',
    2, 2, 20,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
    NULL, NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '45 minutes'
),
(
    'j0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'running',
    2, 1, 5,
    NOW() - INTERVAL '1 hour',
    NULL,
    NULL, NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '30 minutes'
),
(
    'j0000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'queued',
    2, 0, 0,
    NULL, NULL,
    NULL, NULL,
    NOW() - INTERVAL '10 minutes',
    NOW() - INTERVAL '10 minutes'
),
(
    'j0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'failed',
    2, 1, 0,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '30 minutes',
    'Connection timeout after 30 seconds while accessing https://example.com/products',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'
),
(
    'j0000000-0000-0000-0000-000000000005',
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'completed',
    2, 2, 15,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '1 hour',
    NULL, NULL,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days' + INTERVAL '1 hour'
);

-- ============================================================================
-- 7. Scraped Items
-- ============================================================================
-- 20 items from Job 1 (Katalog Elektronik - completed)
INSERT INTO public.scraped_items (id, project_id, scrape_job_id, title, price, description, image_url, source_url, published_date, raw_data, scraped_at, created_at)
VALUES
(
    's0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 1', 'Rp 15.000',
    'High-quality electronic product with advanced features suitable for everyday use.',
    'https://books.toscrape.com/media/cache/image1.jpg',
    'https://books.toscrape.com/catalogue/product-1/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 2', 'Rp 25.000',
    'Durable and reliable electronics with warranty and after-sales support.',
    'https://books.toscrape.com/media/cache/image2.jpg',
    'https://books.toscrape.com/catalogue/product-2/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 3', 'Rp 50.000',
    'Portable electronic device with long battery life and compact design.',
    'https://books.toscrape.com/media/cache/image3.jpg',
    'https://books.toscrape.com/catalogue/product-3/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 4', 'Rp 75.000',
    'Professional-grade equipment for tech enthusiasts and power users.',
    'https://books.toscrape.com/media/cache/image4.jpg',
    'https://books.toscrape.com/catalogue/product-4/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000005',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 5', 'Rp 100.000',
    'Wireless connectivity device with fast data transfer and low latency.',
    'https://books.toscrape.com/media/cache/image5.jpg',
    'https://books.toscrape.com/catalogue/product-5/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000006',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 6', 'Rp 125.000',
    'Smart home device with voice control and multi-platform integration.',
    'https://books.toscrape.com/media/cache/image6.jpg',
    'https://books.toscrape.com/catalogue/product-6/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000007',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 7', 'Rp 150.000',
    'High-performance audio equipment with noise cancellation technology.',
    'https://books.toscrape.com/media/cache/image7.jpg',
    'https://books.toscrape.com/catalogue/product-7/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000008',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 8', 'Rp 175.000',
    'Portable charging solution with fast-charging capability and multiple ports.',
    'https://books.toscrape.com/media/cache/image8.jpg',
    'https://books.toscrape.com/catalogue/product-8/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000009',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 9', 'Rp 200.000',
    'Digital display monitor with 4K resolution and HDR support.',
    'https://books.toscrape.com/media/cache/image9.jpg',
    'https://books.toscrape.com/catalogue/product-9/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000010',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 10', 'Rp 250.000',
    'Mechanical keyboard with RGB lighting and programmable keys.',
    'https://books.toscrape.com/media/cache/image10.jpg',
    'https://books.toscrape.com/catalogue/product-10/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000011',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 11', 'Rp 300.000',
    'Ergonomic mouse with adjustable DPI and programmable buttons.',
    'https://books.toscrape.com/media/cache/image11.jpg',
    'https://books.toscrape.com/catalogue/product-11/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000012',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 12', 'Rp 350.000',
    'External SSD with high-speed data transfer and rugged design.',
    'https://books.toscrape.com/media/cache/image12.jpg',
    'https://books.toscrape.com/catalogue/product-12/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000013',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 13', 'Rp 400.000',
    'Wireless router with dual-band frequency and mesh network support.',
    'https://books.toscrape.com/media/cache/image13.jpg',
    'https://books.toscrape.com/catalogue/product-13/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000014',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 14', 'Rp 450.000',
    'USB-C hub with HDMI, Ethernet, and multiple data ports.',
    'https://books.toscrape.com/media/cache/image14.jpg',
    'https://books.toscrape.com/catalogue/product-14/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000015',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 15', 'Rp 500.000',
    'Webcam with 1080p resolution and built-in microphone for conferencing.',
    'https://books.toscrape.com/media/cache/image15.jpg',
    'https://books.toscrape.com/catalogue/product-15/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000016',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 16', 'Rp 550.000',
    'Wireless earbuds with active noise cancellation and long battery life.',
    'https://books.toscrape.com/media/cache/image16.jpg',
    'https://books.toscrape.com/catalogue/product-16/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000017',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 17', 'Rp 600.000',
    'Smart fitness tracker with heart rate monitor and GPS tracking.',
    'https://books.toscrape.com/media/cache/image17.jpg',
    'https://books.toscrape.com/catalogue/product-17/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000018',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 18', 'Rp 650.000',
    'Portable Bluetooth speaker with 360-degree sound and waterproof design.',
    'https://books.toscrape.com/media/cache/image18.jpg',
    'https://books.toscrape.com/catalogue/product-18/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000019',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 19', 'Rp 700.000',
    'Graphics card with ray tracing support and high VRAM capacity.',
    'https://books.toscrape.com/media/cache/image19.jpg',
    'https://books.toscrape.com/catalogue/product-19/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
),
(
    's0000000-0000-0000-0000-000000000020',
    'p0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000001',
    'Product 20', 'Rp 750.000',
    'All-in-one desktop computer with powerful processor and ample storage.',
    'https://books.toscrape.com/media/cache/image20.jpg',
    'https://books.toscrape.com/catalogue/product-20/index.html',
    NULL, '{}'::jsonb,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'
);

-- 5 items from Job 5 (Berita Teknologi - completed)
INSERT INTO public.scraped_items (id, project_id, scrape_job_id, title, price, description, image_url, source_url, published_date, raw_data, scraped_at, created_at)
VALUES
(
    's0000000-0000-0000-0000-000000000021',
    'p0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000005',
    'Perkembangan AI di Indonesia 2024',
    NULL,
    'Artikel ini membahas perkembangan kecerdasan buatan di Indonesia sepanjang tahun 2024, termasuk adopsi oleh perusahaan lokal dan startup.',
    'https://example.com/images/ai-indonesia.jpg',
    'https://example.com/news/tech/ai-indonesia-2024',
    NOW() - INTERVAL '6 days',
    '{"author":"Budi Santoso","category":"Artificial Intelligence"}'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
    's0000000-0000-0000-0000-000000000022',
    'p0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000005',
    '5G Network Meluas, Ini Dampaknya',
    NULL,
    'Jaringan 5G semakin meluas di Indonesia. Simak dampak positif dan tantangan yang dihadapi dalam implementasinya.',
    'https://example.com/images/5g-network.jpg',
    'https://example.com/news/tech/5g-network-impact',
    NOW() - INTERVAL '7 days',
    '{"author":"Citra Dewi","category":"Telecommunications"}'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
    's0000000-0000-0000-0000-000000000023',
    'p0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000005',
    'Startup Teknologi Raup Pendanaan Besar',
    NULL,
    'Beberapa startup teknologi Indonesia berhasil mendapatkan pendanaan seri A dan B dari investor internasional.',
    'https://example.com/images/startup-funding.jpg',
    'https://example.com/news/tech/startup-funding-series',
    NOW() - INTERVAL '8 days',
    '{"author":"Andi Pratama","category":"Startup"}'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
    's0000000-0000-0000-0000-000000000024',
    'p0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000005',
    'Transformasi Digital di Sektor Pendidikan',
    NULL,
    'Digitalisasi pendidikan terus berlanjut dengan platform e-learning dan kolaborasi antara institusi pendidikan dan perusahaan teknologi.',
    'https://example.com/images/digital-education.jpg',
    'https://example.com/news/tech/digital-education-transformation',
    NOW() - INTERVAL '9 days',
    '{"author":"Sari Indah","category":"Education"}'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
),
(
    's0000000-0000-0000-0000-000000000025',
    'p0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000005',
    'Keamanan Siber Jadi Prioritas Utama',
    NULL,
    'Dengan meningkatnya serangan siber, perusahaan di Indonesia mulai meningkatkan investasi di bidang keamanan siber.',
    'https://example.com/images/cybersecurity.jpg',
    'https://example.com/news/tech/cybersecurity-priority',
    NOW() - INTERVAL '10 days',
    '{"author":"Dimas Ardiansyah","category":"Cybersecurity"}'::jsonb,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'
);

-- ============================================================================
-- 8. Export Logs
-- ============================================================================
INSERT INTO public.export_logs (id, project_id, user_id, file_name, file_path, total_items, created_at)
VALUES
(
    'x0000000-0000-0000-0000-000000000001',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'katalog_elektronik_2024-12-01.csv',
    'exports/katalog_elektronik_2024-12-01.csv',
    20,
    NOW() - INTERVAL '2 days'
),
(
    'x0000000-0000-0000-0000-000000000002',
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'katalog_elektronik_2024-12-02.xlsx',
    'exports/katalog_elektronik_2024-12-02.xlsx',
    20,
    NOW() - INTERVAL '1 day'
),
(
    'x0000000-0000-0000-0000-000000000003',
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'berita_teknologi_2024-12-01.json',
    'exports/berita_teknologi_2024-12-01.json',
    5,
    NOW() - INTERVAL '4 days'
);

-- ============================================================================
-- 9. Audit Logs
-- ============================================================================
INSERT INTO public.audit_logs (id, user_id, action, entity_type, entity_id, domain, metadata, created_at)
VALUES
(
    'l0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'project.created',
    'project',
    'p0000000-0000-0000-0000-000000000001',
    NULL,
    '{"project_name":"Katalog Elektronik","data_type":"product"}'::jsonb,
    NOW() - INTERVAL '14 days'
),
(
    'l0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'scrape_job.started',
    'scrape_job',
    'j0000000-0000-0000-0000-000000000001',
    'books.toscrape.com',
    '{"project_name":"Katalog Elektronik","total_urls":2}'::jsonb,
    NOW() - INTERVAL '3 days'
),
(
    'l0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'scrape_job.completed',
    'scrape_job',
    'j0000000-0000-0000-0000-000000000001',
    'books.toscrape.com',
    '{"project_name":"Katalog Elektronik","total_items":20,"duration_minutes":45}'::jsonb,
    NOW() - INTERVAL '3 days' + INTERVAL '45 minutes'
),
(
    'l0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'export.created',
    'export_log',
    'x0000000-0000-0000-0000-000000000001',
    NULL,
    '{"project_name":"Katalog Elektronik","format":"csv","total_items":20}'::jsonb,
    NOW() - INTERVAL '2 days'
),
(
    'l0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000002',
    'user.login',
    'user',
    'a0000000-0000-0000-0000-000000000002',
    NULL,
    '{"ip_address":"192.168.1.100","user_agent":"Mozilla/5.0"}'::jsonb,
    NOW() - INTERVAL '12 hours'
);

-- ============================================================================
-- 10. Error Logs
-- ============================================================================
-- 2 errors for the failed job (j0000000-0000-0000-0000-000000000004)
INSERT INTO public.error_logs (id, scrape_job_id, project_id, url, error_code, error_message, error_stack, created_at)
VALUES
(
    'r0000000-0000-0000-0000-000000000001',
    'j0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000001',
    'https://example.com/products',
    'TIMEOUT',
    'Connection timeout after 30 seconds while fetching https://example.com/products',
    'TimeoutError: Connection timeout\n    at ScrapeWorker.fetch (workers/scrape.worker.ts:85)\n    at ScrapeWorker.processUrl (workers/scrape.worker.ts:142)',
    NOW() - INTERVAL '2 days'
),
(
    'r0000000-0000-0000-0000-000000000002',
    'j0000000-0000-0000-0000-000000000004',
    'p0000000-0000-0000-0000-000000000001',
    'https://example.com/products',
    'CONN_REFUSED',
    'Connection refused by the server for https://example.com/products',
    'ConnectionRefusedError: connect ECONNREFUSED\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1159)',
    NOW() - INTERVAL '2 days' + INTERVAL '30 minutes'
),
-- 1 general system error (not tied to a specific job, but still needs project context)
(
    'r0000000-0000-0000-0000-000000000003',
    NULL,
    'p0000000-0000-0000-0000-000000000002',
    'https://example.com/news/tech',
    'RATE_LIMIT',
    'Rate limit exceeded for domain example.com. Maximum 10 requests per minute allowed.',
    'RateLimitError: Too Many Requests\n    at RateLimiter.check (utils/rate-limiter.ts:34)\n    at ScrapeWorker.run (workers/scrape.worker.ts:67)',
    NOW() - INTERVAL '4 days'
);

-- ============================================================================
-- 11. Domain Blocklist
-- ============================================================================
INSERT INTO public.domain_blocklist (id, domain, reason, is_active, created_by, created_at, updated_at)
VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'example-blocked.com',
    'Domain terdeteksi melakukan scraping blocking dan melarang akses otomatis.',
    TRUE,
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'malicious-site.org',
    'Domain berbahaya yang terdeteksi menyebarkan malware dan konten berbahaya.',
    TRUE,
    'a0000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
);
