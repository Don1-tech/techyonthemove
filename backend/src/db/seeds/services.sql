-- =========================================================
-- SERVICE SEED DATA
-- =========================================================

INSERT INTO services (
    id,
    name,
    description,
    base_price
)
VALUES
(
    'wifi-internet',
    'Wi-Fi & Internet',
    'Wi-Fi installation, configuration, coverage and internet connectivity support.',
    NULL
),
(
    'network-issues',
    'Network Issues',
    'Troubleshooting and repair of wired and wireless network problems.',
    NULL
),
(
    'pc-laptops',
    'PC & Laptops',
    'Computer and laptop hardware, software, setup and troubleshooting support.',
    NULL
),
(
    'tv-entertainment',
    'TV & Entertainment',
    'TV, entertainment system, connectivity and setup support.',
    NULL
),
(
    'smart-home',
    'Smart Home',
    'Smart home device installation, configuration and connectivity support.',
    NULL
),
(
    'smart-devices',
    'Smart Devices',
    'Setup and troubleshooting for connected smart devices.',
    NULL
),
(
    'cctv',
    'CCTV',
    'CCTV installation, configuration, troubleshooting and support.',
    NULL
),
(
    'other-repairs',
    'Other Repairs',
    'Other computer, network and technology-related repairs and support.',
    NULL
)
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;