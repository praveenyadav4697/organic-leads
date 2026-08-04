<?php
/**
 * Tracking script detection for Organic Leads Connector.
 *
 * Detects installed tracking providers by scanning the site's rendered HTML
 * head and footer for known tracking script signatures (GA4, GTM, Meta Pixel,
 * Microsoft Clarity, LinkedIn Insight, Google Search Console, Site Kit,
 * MonsterInsights, PixelYourSite, WPCode, Header Footer Code Manager, manual).
 */

if (!defined('ABSPATH')) {
    exit;
}

class Organic_Leads_Tracking {
    private $supported_providers = array(
        'google_analytics_4'      => 'Google Analytics 4',
        'google_tag_manager'      => 'Google Tag Manager',
        'meta_pixel'              => 'Meta Pixel',
        'microsoft_clarity'       => 'Microsoft Clarity',
        'linkedin_insight'        => 'LinkedIn Insight Tag',
        'google_search_console'   => 'Google Search Console',
        'google_site_kit'         => 'Google Site Kit',
        'monsterinsights'         => 'MonsterInsights',
        'pixelyoursite'           => 'PixelYourSite',
        'wpcode'                  => 'WPCode',
        'header_footer_code_manager' => 'Header Footer Code Manager',
        'manual_scripts'          => 'Manual Tracking Scripts',
    );

    public function get_tracking_scripts() {
        $scripts = array();
        $detected_providers = array();

        $head_html = $this->get_head_html();
        $footer_html = $this->get_footer_html();
        $combined_html = $head_html . "\n" . $footer_html;

        error_log('[Organic Leads Tracking] Discovering tracking scripts...');

        // --- Google Analytics 4 ---
        error_log('[Organic Leads Tracking] Checking Google Analytics...');
        $ga4 = $this->detect_ga4($combined_html);
        if ($ga4 !== false) {
            error_log('[Organic Leads Tracking] FOUND Google Analytics. Measurement ID: ' . $ga4);
            $scripts[] = array(
                'id'                    => 'ga4',
                'provider'              => 'google_analytics_4',
                'provider_label'        => 'Google Analytics 4',
                'tracking_id'           => $ga4,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('google_analytics_4', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'measurement_id'    => $ga4,
                    'connected'         => true,
                ),
            );
            $detected_providers['google_analytics_4'] = true;
        } else {
            error_log('[Organic Leads Tracking] Google Analytics NOT FOUND');
        }

        // --- Google Tag Manager ---
        error_log('[Organic Leads Tracking] Checking GTM...');
        $gtm = $this->detect_gtm($combined_html);
        if ($gtm !== false) {
            error_log('[Organic Leads Tracking] FOUND GTM. Container: ' . $gtm);
            $scripts[] = array(
                'id'                    => 'gtm',
                'provider'              => 'google_tag_manager',
                'provider_label'        => 'Google Tag Manager',
                'tracking_id'           => $gtm,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('google_tag_manager', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'container_id'      => $gtm,
                    'connected'         => true,
                ),
            );
            $detected_providers['google_tag_manager'] = true;
        } else {
            error_log('[Organic Leads Tracking] GTM NOT FOUND');
        }

        // --- Meta Pixel ---
        error_log('[Organic Leads Tracking] Checking Meta Pixel...');
        $meta = $this->detect_meta_pixel($combined_html);
        if ($meta !== false) {
            error_log('[Organic Leads Tracking] FOUND Meta Pixel. ID: ' . $meta);
            $scripts[] = array(
                'id'                    => 'meta_pixel',
                'provider'              => 'meta_pixel',
                'provider_label'        => 'Meta Pixel',
                'tracking_id'           => $meta,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('meta_pixel', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'pixel_id'          => $meta,
                    'connected'         => true,
                ),
            );
            $detected_providers['meta_pixel'] = true;
        } else {
            error_log('[Organic Leads Tracking] Meta Pixel NOT FOUND');
        }

        // --- Microsoft Clarity ---
        error_log('[Organic Leads Tracking] Checking Microsoft Clarity...');
        $clarity = $this->detect_clarity($combined_html);
        if ($clarity !== false) {
            error_log('[Organic Leads Tracking] FOUND Microsoft Clarity. Project ID: ' . $clarity);
            $scripts[] = array(
                'id'                    => 'clarity',
                'provider'              => 'microsoft_clarity',
                'provider_label'        => 'Microsoft Clarity',
                'tracking_id'           => $clarity,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('microsoft_clarity', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'project_id'        => $clarity,
                    'connected'         => true,
                ),
            );
            $detected_providers['microsoft_clarity'] = true;
        } else {
            error_log('[Organic Leads Tracking] Microsoft Clarity NOT FOUND');
        }

        // --- LinkedIn Insight Tag ---
        error_log('[Organic Leads Tracking] Checking LinkedIn Insight Tag...');
        $linkedin = $this->detect_linkedin($combined_html);
        if ($linkedin !== false) {
            error_log('[Organic Leads Tracking] FOUND LinkedIn Insight Tag. Partner ID: ' . $linkedin);
            $scripts[] = array(
                'id'                    => 'linkedin',
                'provider'              => 'linkedin_insight',
                'provider_label'        => 'LinkedIn Insight Tag',
                'tracking_id'           => $linkedin,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('linkedin_insight', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'partner_id'        => $linkedin,
                    'connected'         => true,
                ),
            );
            $detected_providers['linkedin_insight'] = true;
        } else {
            error_log('[Organic Leads Tracking] LinkedIn Insight Tag NOT FOUND');
        }

        // --- Google Search Console ---
        error_log('[Organic Leads Tracking] Checking Google Search Console...');
        $gsc = $this->detect_gsc($combined_html, $detected_providers);
        if ($gsc !== false) {
            error_log('[Organic Leads Tracking] FOUND Google Search Console. Verification: ' . $gsc);
            $scripts[] = array(
                'id'                    => 'gsc',
                'provider'              => 'google_search_console',
                'provider_label'        => 'Google Search Console',
                'tracking_id'           => $gsc,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('google_search_console', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'verification_code' => $gsc,
                    'connected'         => true,
                ),
            );
            $detected_providers['google_search_console'] = true;
        } else {
            error_log('[Organic Leads Tracking] Google Search Console NOT FOUND');
        }

        // --- Google Site Kit ---
        error_log('[Organic Leads Tracking] Checking Google Site Kit...');
        $site_kit = $this->detect_site_kit($combined_html);
        if ($site_kit !== false) {
            error_log('[Organic Leads Tracking] FOUND Google Site Kit.');
            $scripts[] = array(
                'id'                    => 'site-kit',
                'provider'              => 'google_site_kit',
                'provider_label'        => 'Google Site Kit',
                'tracking_id'           => $site_kit,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('google_site_kit', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'connected'         => true,
                ),
            );
            $detected_providers['google_site_kit'] = true;
        } else {
            error_log('[Organic Leads Tracking] Google Site Kit NOT FOUND');
        }

        // --- MonsterInsights ---
        error_log('[Organic Leads Tracking] Checking MonsterInsights...');
        $monster = $this->detect_monsterinsights($combined_html);
        if ($monster !== false) {
            error_log('[Organic Leads Tracking] FOUND MonsterInsights. ID: ' . $monster);
            $scripts[] = array(
                'id'                    => 'monsterinsights',
                'provider'              => 'monsterinsights',
                'provider_label'        => 'MonsterInsights',
                'tracking_id'           => $monster,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('monsterinsights', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'connected'         => true,
                ),
            );
            $detected_providers['monsterinsights'] = true;
        } else {
            error_log('[Organic Leads Tracking] MonsterInsights NOT FOUND');
        }

        // --- PixelYourSite ---
        error_log('[Organic Leads Tracking] Checking PixelYourSite...');
        $pixel_your_site = $this->detect_pixelyoursite($combined_html);
        if ($pixel_your_site !== false) {
            error_log('[Organic Leads Tracking] FOUND PixelYourSite. ID: ' . $pixel_your_site);
            $scripts[] = array(
                'id'                    => 'pixelyoursite',
                'provider'              => 'pixelyoursite',
                'provider_label'        => 'PixelYourSite',
                'tracking_id'           => $pixel_your_site,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('pixelyoursite', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'connected'         => true,
                ),
            );
            $detected_providers['pixelyoursite'] = true;
        } else {
            error_log('[Organic Leads Tracking] PixelYourSite NOT FOUND');
        }

        // --- WPCode ---
        error_log('[Organic Leads Tracking] Checking WPCode...');
        $wpcode = $this->detect_wpcode($combined_html);
        if ($wpcode !== false) {
            error_log('[Organic Leads Tracking] FOUND WPCode.');
            $scripts[] = array(
                'id'                    => 'wpcode',
                'provider'              => 'wpcode',
                'provider_label'        => 'WPCode',
                'tracking_id'           => $wpcode,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('wpcode', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'connected'         => true,
                ),
            );
            $detected_providers['wpcode'] = true;
        } else {
            error_log('[Organic Leads Tracking] WPCode NOT FOUND');
        }

        // --- Header Footer Code Manager ---
        error_log('[Organic Leads Tracking] Checking Header Footer Code Manager...');
        $hfcm = $this->detect_hfcm($combined_html);
        if ($hfcm !== false) {
            error_log('[Organic Leads Tracking] FOUND Header Footer Code Manager.');
            $scripts[] = array(
                'id'                    => 'hfcm',
                'provider'              => 'header_footer_code_manager',
                'provider_label'        => 'Header Footer Code Manager',
                'tracking_id'           => $hfcm,
                'status'                => 'active',
                'verification_status'   => 'pending',
                'health_status'         => 'unknown',
                'installation_method'   => $this->detect_installation_method('header_footer_code_manager', $combined_html),
                'detected_version'      => null,
                'last_verified'         => null,
                'settings'              => array(
                    'connected'         => true,
                ),
            );
            $detected_providers['header_footer_code_manager'] = true;
        } else {
            error_log('[Organic Leads Tracking] Header Footer Code Manager NOT FOUND');
        }

        // --- Manual Tracking Scripts ---
        error_log('[Organic Leads Tracking] Checking Manual Tracking Scripts...');
        $manual = $this->detect_manual_scripts($combined_html);
        if ($manual !== false) {
            error_log('[Organic Leads Tracking] FOUND Manual Tracking Scripts. Count: ' . count($manual));
            foreach ($manual as $idx => $manual_script) {
                $scripts[] = array(
                    'id'                    => 'manual_' . ($idx + 1),
                    'provider'              => 'manual_scripts',
                    'provider_label'        => 'Manual Tracking Script',
                    'tracking_id'           => $manual_script['src'] ?: 'manual-' . ($idx + 1),
                    'status'                => 'active',
                    'verification_status'   => 'pending',
                    'health_status'         => 'unknown',
                    'installation_method'   => 'manual',
                    'detected_version'      => null,
                    'last_verified'         => null,
                    'settings'              => array(
                        'src'               => $manual_script['src'],
                        'inline_code'       => $manual_script['inline'] ?: null,
                        'connected'         => true,
                    ),
                );
            }
            $detected_providers['manual_scripts'] = true;
        } else {
            error_log('[Organic Leads Tracking] Manual Tracking Scripts NOT FOUND');
        }

        // Also check installed plugins for tracking-related plugins
        $installed_tracking_plugins = $this->get_installed_tracking_plugins();

        // Determine connected providers
        $connected_providers = array();
        foreach ($this->supported_providers as $key => $label) {
            $connected_providers[] = array(
                'provider'      => $key,
                'label'         => $label,
                'connected'     => isset($detected_providers[$key]),
            );
        }

        error_log('[Organic Leads Tracking] Discovery complete. Total scripts: ' . count($scripts));

        return array(
            'scripts'                 => $scripts,
            'total'                   => count($scripts),
            'connected_providers'     => $connected_providers,
            'installed_tracking_plugins' => $installed_tracking_plugins,
            'synced_at'               => current_time('c'),
        );
    }

    public function get_tracking_scripts_health() {
        $data = $this->get_tracking_scripts();
        return array(
            'total_providers'   => count($this->supported_providers),
            'connected_count'   => count($data['scripts']),
            'scripts'           => $data['scripts'],
            'synced_at'         => current_time('c'),
        );
    }

    private function detect_ga4($html) {
        // G-A-XXXXXXXXX or G-XXXXXXXXXX
        if (preg_match('/G-[A-Z0-9]{8,}/', $html, $matches)) {
            return $matches[0];
        }
        // gtag('config', 'G-XXXXXXXXX')
        if (preg_match("/gtag\s*\(\s*['\"]config['\"]\s*,\s*['\"](G-[A-Z0-9]{8,})['\"]/", $html, $matches)) {
            return $matches[1];
        }
        return false;
    }

    private function detect_gtm($html) {
        // GTM-XXXXXXX
        if (preg_match('/GTM-[A-Z0-9]{6,}/', $html, $matches)) {
            return $matches[0];
        }
        return false;
    }

    private function detect_meta_pixel($html) {
        // fbq('init', 'XXXXXXXXXX')
        if (preg_match("/fbq\s*\(\s*['\"]init['\"]\s*,\s*['\"]([0-9]{15,16})['\"]/", $html, $matches)) {
            return $matches[1];
        }
        // fbq('init', 'XXXXXXXXXX') with the pixel ID in meta tag
        if (preg_match('/fbq\s*\(\s*["\']init["\']\s*,\s*["\'](\d{15,16})["\']/', $html, $matches)) {
            return $matches[1];
        }
        // <meta name="facebook-domain-verification" content="...">
        if (preg_match('/facebook-domain-verification["\'][^>]*content=["\']([^"\']+)["\']/', $html, $matches)) {
            return $matches[1];
        }
        return false;
    }

    private function detect_clarity($html) {
        // clarity('init', 'XXXXXX') or https://www.clarity.ms/...id=XXXXXX
        if (preg_match("/clarity\s*\(\s*['\"]init['\"]\s*,\s*['\"]([a-z0-9]+)['\"]/", $html, $matches)) {
            return $matches[1];
        }
        if (preg_match('/clarity\.ms\/.*id=([a-z0-9]+)/', $html, $matches)) {
            return $matches[1];
        }
        return false;
    }

    private function detect_linkedin($html) {
        // _linkedin_partner_id = "XXXXXX";
        if (preg_match('/_linkedin_partner_id\s*=\s*["\'](\d+)["\']/', $html, $matches)) {
            return $matches[1];
        }
        // https://snap.licdn.com/.../tpc_reset.
        if (preg_match('/_linkedin_partner_id\s*=\s*["\']?(\d+)["\']?/', $html, $matches)) {
            return $matches[1];
        }
        return false;
    }

    private function detect_gsc($html, $detected_providers) {
        // Google Search Console verification: <meta name="google-site-verification" content="CODE">
        if (preg_match('/<meta\s+name=["\']google-site-verification["\']\s+content=["\']([^"\']+)["\']\s*\/?>/i', $html, $matches)) {
            return $matches[1];
        }
        // Also check if GA4 is connected — GSC is typically associated
        return false;
    }

    private function detect_site_kit($html) {
        // Google Site Kit scripts
        if (preg_match('/googlesitekit\/|google-site-kit|sitekit\.js|data-googlesitekit/i', $html, $matches)) {
            return 'site-kit';
        }
        // Check for Site Kit script src
        if (preg_match('/src=["\'][^"\']*googlesitekit[^"\']*["\']/', $html, $matches)) {
            return 'site-kit';
        }
        return false;
    }

    private function detect_monsterinsights($html) {
        // MonsterInsights / ExactMetrics gtag injection
        if (preg_match('/monsterinsights|exactmetrics|gtag\(.*monsterinsights|mi_js_config|monsterinsights_frontend/i', $html, $matches)) {
            if (preg_match('/G-[A-Z0-9]{8,}/', $html, $id_matches)) {
                return $id_matches[0];
            }
            return 'monsterinsights';
        }
        return false;
    }

    private function detect_pixelyoursite($html) {
        // PixelYourSite / Pixel Caffeine
        if (preg_match('/pixel-caffeine|pixelyoursite|py_\w+_options|pixelyoursite_js|pixel-your-site/i', $html, $matches)) {
            if (preg_match('/fbq\s*\(\s*['\"]init['\"]\s*,\s*['\"]([0-9]{15,16})['\"]/', $html, $id_matches)) {
                return $id_matches[1];
            }
            if (preg_match('/fbq\s*\(\s*["\']init["\']\s*,\s*["\'](\d{15,16})["\']/', $html, $id_matches)) {
                return $id_matches[1];
            }
            return 'pixelyoursite';
        }
        return false;
    }

    private function detect_wpcode($html) {
        // WPCode / Insert Headers and Footers
        if (preg_match('/wpcode|insert-headers-and-footers|ihaf_|wpcode_embed|wpcode-embed/i', $html, $matches)) {
            return 'wpcode';
        }
        return false;
    }

    private function detect_hfcm($html) {
        // Header Footer Code Manager
        if (preg_match('/hfcm_|header-footer-code-manager|hfcm-mini|hfcm-header|hfcm-footer/i', $html, $matches)) {
            return 'hfcm';
        }
        return false;
    }

    private function detect_manual_scripts($html) {
        $manual_scripts = array();
        $known_tracking_domains = array(
            'googletagmanager.com',
            'google-analytics.com',
            'analytics.google.com',
            'facebook.com/tr',
            'connect.facebook.net',
            'clarity.ms',
            'linkedin.com/insight',
            'hotjar.com',
            'mixpanel.com',
            'amplitude.com',
            'segment.com',
            'heap.io',
            'fullstory.com',
            'mouseflow.com',
            'crazyegg.com',
            'optimizely.com',
            'tealiumiq.com',
            'googleoptimize.com',
            'googleadservices.com',
        );

        // Match script tags with known tracking domains
        if (preg_match_all('/<script[^>]+src=["\']([^"\']+)["\'][^>]*>/i', $html, $script_matches)) {
            foreach ($script_matches[1] as $src) {
                $src_lower = strtolower($src);
                foreach ($known_tracking_domains as $domain) {
                    if (strpos($src_lower, $domain) !== false) {
                        $manual_scripts[] = array(
                            'src'     => $src,
                            'inline'  => false,
                        );
                        break;
                    }
                }
            }
        }

        // Match inline scripts with tracking code
        if (preg_match_all('/<script[^>]*>(.*?)<\/script>/is', $html, $inline_matches)) {
            foreach ($inline_matches[1] as $inline) {
                $inline_lower = strtolower($inline);
                $is_tracking = false;
                foreach ($known_tracking_domains as $domain) {
                    if (strpos($inline_lower, $domain) !== false) {
                        $is_tracking = true;
                        break;
                    }
                }
                if ($is_tracking) {
                    $manual_scripts[] = array(
                        'src'     => null,
                        'inline'  => substr($inline, 0, 200),
                    );
                }
            }
        }

        return !empty($manual_scripts) ? $manual_scripts : false;
    }

    private function detect_installation_method($provider, $html) {
        $methods = array();

        if (strpos($html, 'googletagmanager.com') !== false || strpos($html, 'www.googletagmanager.com') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'googletagmanager.com/gtag/js') !== false || strpos($html, 'www.googletagmanager.com/gtag/js') !== false) {
            $methods[] = 'gtag';
        }
        if (strpos($html, 'gtm.js') !== false || strpos($html, 'gtm-') !== false) {
            $methods[] = 'gtm';
        }
        if (strpos($html, 'facebook.com/tr') !== false || strpos($html, 'fbq') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'clarity.ms') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'snap.licdn.com') !== false || strpos($html, 'linkedin') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'googlesitekit') !== false || strpos($html, 'google-site-kit') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'monsterinsights') !== false || strpos($html, 'exactmetrics') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'pixel-caffeine') !== false || strpos($html, 'pixelyoursite') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'wpcode') !== false || strpos($html, 'insert-headers-and-footers') !== false) {
            $methods[] = 'plugin';
        }
        if (strpos($html, 'hfcm') !== false || strpos($html, 'header-footer-code-manager') !== false) {
            $methods[] = 'plugin';
        }

        // Check for manual/html insertion
        $plugin_map = array(
            'google_analytics_4'        => 'google-analytics',
            'google_tag_manager'        => 'google-tag-manager',
            'meta_pixel'                => 'facebook-pixel',
            'microsoft_clarity'         => 'google-analytics',
            'linkedin_insight'          => 'linkedin-insight-tag',
            'google_search_console'     => 'google-search-console',
            'google_site_kit'           => 'google-site-kit',
            'monsterinsights'           => 'monsterinsights',
            'pixelyoursite'             => 'pixel-caffeine',
            'wpcode'                    => 'wpcode',
            'header_footer_code_manager' => 'header-footer-code-manager',
        );

        if (isset($plugin_map[$provider])) {
            // Check if the plugin file exists in active plugins
            $plugin_file = $plugin_map[$provider];
            // We'll also check for "manual" insertion
            if (empty($methods)) {
                $methods[] = 'manual';
            }
        }

        if (empty($methods)) {
            $methods[] = 'manual';
        }

        return implode(', ', array_unique($methods));
    }

    private function get_installed_tracking_plugins() {
        $installed = array();
        $active_plugins = get_option('active_plugins', array());

        $tracking_plugin_slugs = array(
            'google-analytics'        => 'Google Analytics',
            'google-tag-manager'      => 'Google Tag Manager',
            'facebook-pixel'          => 'Meta Pixel',
            'duracelltomi-google-analytics' => 'Google Analytics (DuracellTomi)',
            'monsterinsights'         => 'MonsterInsights',
            'pixel-caffeine'          => 'PixelCaffeine',
            'wp-google-analytics'     => 'WP Google Analytics',
            'exactmetrics'            => 'ExactMetrics',
            'ga-google-analytics'     => 'GA Google Analytics',
            'site-kit-google'         => 'Google Site Kit',
            'gtm-4-wp'                => 'GTM4WP',
            'insert-headers-and-footers' => 'Insert Headers and Footers',
            'wp-seo'                  => 'Yoast SEO',
            'wordpress-seo'           => 'Yoast SEO',
            'rank-math'               => 'Rank Math',
            'hubspot'                 => 'HubSpot',
            'mailchimp-for-wp'        => 'Mailchimp for WordPress',
        );

        foreach ($active_plugins as $plugin_path) {
            $plugin_file = WP_PLUGIN_DIR . '/' . $plugin_path;
            if (!file_exists($plugin_file)) {
                continue;
            }

            $plugin_data = get_plugin_data($plugin_file, false);
            $slug = dirname($plugin_path);

            // Check name match or slug match
            $is_tracking = false;
            foreach ($tracking_plugin_slugs as $search_slug => $label) {
                if (strpos(strtolower($slug), $search_slug) !== false ||
                    strpos(strtolower($plugin_data['Name']), strtolower($search_slug)) !== false) {
                    $is_tracking = $label;
                    break;
                }
            }

            if ($is_tracking) {
                $installed[] = array(
                    'name'       => $plugin_data['Name'],
                    'slug'       => $slug,
                    'version'    => $plugin_data['Version'],
                    'status'     => 'active',
                    'description' => $plugin_data['Description'],
                );
            }
        }

        // Also search all installed (not just active) tracking plugins
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $all_plugins = get_plugins();
        foreach ($all_plugins as $plugin_path => $plugin) {
            $slug = dirname($plugin_path);
            $already_added = false;
            foreach ($installed as $p) {
                if ($p['slug'] === $slug) {
                    $already_added = true;
                    break;
                }
            }
            if ($already_added) {
                continue;
            }

            $is_tracking = false;
            foreach ($tracking_plugin_slugs as $search_slug => $label) {
                if (strpos(strtolower($slug), $search_slug) !== false ||
                    strpos(strtolower($plugin['Name']), strtolower($search_slug)) !== false) {
                    $is_tracking = $label;
                    break;
                }
            }

            if ($is_tracking) {
                $is_active = in_array($plugin_path, $active_plugins);
                $installed[] = array(
                    'name'       => $plugin['Name'],
                    'slug'       => $slug,
                    'version'    => $plugin['Version'],
                    'status'     => $is_active ? 'active' : 'inactive',
                    'description' => $plugin['Description'],
                );
            }
        }

        return $installed;
    }

    private function get_head_html() {
        ob_start();
        if (did_action('wp_head') === 0) {
            $url = home_url('/');
            $response = wp_safe_remote_get($url, array('timeout' => 10));
            if (is_wp_error($response)) {
                return '';
            }
            $body = wp_remote_retrieve_body($response);
            if (preg_match('/<head[^>]*>(.*?)<\/head>/is', $body, $matches)) {
                return $matches[0];
            }
            return $body;
        }
        wp_head();
        $head_output = ob_get_clean();
        return $head_output;
    }

    private function get_footer_html() {
        ob_start();
        if (did_action('wp_footer') === 0) {
            $url = home_url('/');
            $response = wp_safe_remote_get($url, array('timeout' => 10));
            if (is_wp_error($response)) {
                return '';
            }
            return wp_remote_retrieve_body($response);
        }
        wp_footer();
        $footer_output = ob_get_clean();
        return $footer_output;
    }

    public function get_spam_protection() {
        $plugins = $this->get_installed_plugins();
        $spam_plugins = array();
        $configured = array(
            'recaptcha'            => array('enabled' => false, 'type' => null, 'site_key' => null),
            'hcaptcha'             => array('enabled' => false, 'type' => null, 'site_key' => null),
            'honeypot'             => array('enabled' => false, 'type' => null),
            'akismet'              => array('enabled' => false, 'type' => null),
        );

        // Check active plugins for spam protection
        foreach ($plugins as $plugin) {
            $name_lower = strtolower($plugin['name']);
            $slug_lower = strtolower($plugin['slug']);

            if (strpos($slug_lower, 'google-analytics') !== false || strpos($name_lower, 'recaptcha') !== false) {
                if (strpos($slug_lower, 'recaptcha') !== false || strpos($name_lower, 'recaptcha') !== false) {
                    $configured['recaptcha']['enabled'] = true;
                    $configured['recaptcha']['type'] = strpos($name_lower, 'v3') !== false ? 'v3' : 'v2';
                    $configured['recaptcha']['site_key'] = $this->get_option('recaptcha_site_key') ?: $this->get_option('google_recaptcha_key');
                    $spam_plugins[] = $plugin;
                }
            }

            if (strpos($slug_lower, 'hcaptcha') !== false || strpos($name_lower, 'hcaptcha') !== false) {
                $configured['hcaptcha']['enabled'] = true;
                $configured['hcaptcha']['type'] = 'checkbox';
                $configured['hcaptcha']['site_key'] = $this->get_option('hcaptcha_site_key');
                $spam_plugins[] = $plugin;
            }

            if (strpos($name_lower, 'akismet') !== false) {
                $configured['akismet']['enabled'] = true;
                $configured['akismet']['type'] = 'antispam';
                $spam_plugins[] = $plugin;
            }
        }

        // Check for honeypot in settings/options
        if ($this->has_honeypot()) {
            $configured['honeypot']['enabled'] = true;
            $configured['honeypot']['type'] = 'honeypot';
        }

        // Check form plugin spam settings
        $forms = array();
        if (class_exists('WPCF7_ContactForm')) {
            // Contact Form 7 reCAPTCHA
            $config = get_option('wpcf7_recaptcha');
            if (!empty($config['sitekey']) || !empty($config['api_key'])) {
                $configured['recaptcha']['enabled'] = true;
                $configured['recaptcha']['site_key'] = $config['sitekey'];
            }
        }

        if (class_exists('WPForms')) {
            $wpforms_recaptcha = get_option('wpforms_recaptcha');
            if (!empty($wpforms_recaptcha)) {
                $configured['recaptcha']['enabled'] = true;
                $configured['recaptcha']['site_key'] = $wpforms_recaptcha['site_key'] ?? null;
            }
            $wpforms_honeypot = get_option('wpforms_honeypot');
            if (!empty($wpforms_honeypot)) {
                $configured['honeypot']['enabled'] = true;
            }
        }

        if (class_exists('GFForms')) {
            // Gravity Forms honeypot
            $gf_honeypot = rgar(get_option('gform_bypass_redis'), 'enabled');
            $configured['honeypot']['enabled'] = $configured['honeypot']['enabled'] || $this->has_gf_honeypot();
        }

        if (class_exists('FluentForm\Framework\Foundation\Application')) {
            $ff_honeypot = get_option('fluentform_honeypot');
            if (!empty($ff_honeypot)) {
                $configured['honeypot']['enabled'] = true;
            }
            $ff_recaptcha = get_option('fluentform_recaptcha');
            if (!empty($ff_recaptcha)) {
                $configured['recaptcha']['enabled'] = true;
                $configured['recaptcha']['site_key'] = $ff_recaptcha['site_key'] ?? null;
            }
        }

        return array(
            'spam_protection'   => $configured,
            'spam_plugins'      => $spam_plugins,
            'all_form_plugins'  => $this->get_form_plugin_spam_config(),
            'synced_at'         => current_time('c'),
        );
    }

    private function get_form_plugin_spam_config() {
        $result = array();

        // Contact Form 7
        if (class_exists('WPCF7_ContactForm') && class_exists('WPCF7_ContactFormFactory')) {
            $recaptcha = get_option('wpcf7_recaptcha');
            $result[] = array(
                'plugin'           => 'contact-form-7',
                'recaptcha_enabled' => !empty($recaptcha['sitekey']) || !empty($recaptcha['api_key']),
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => true, // CF7 uses Akismet by default
            );
        }

        // WPForms
        if (class_exists('WPForms')) {
            $recaptcha = get_option('wpforms_recaptcha');
            $honeypot = get_option('wpforms_honeypot');
            $result[] = array(
                'plugin'           => 'wpforms',
                'recaptcha_enabled' => !empty($recaptcha),
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => !empty($honeypot),
                'akismet_enabled'   => false,
            );
        }

        // Gravity Forms
        if (class_exists('GFForms')) {
            $result[] = array(
                'plugin'           => 'gravityforms',
                'recaptcha_enabled' => $this->has_gf_recaptcha(),
                'hcaptcha_enabled'  => $this->has_gf_hcaptcha(),
                'honeypot_enabled'  => $this->has_gf_honeypot(),
                'akismet_enabled'   => false,
            );
        }

        // Fluent Forms
        if (class_exists('FluentForm\Framework\Foundation\Application')) {
            $config = get_option('fluentform_form_config', array());
            $result[] = array(
                'plugin'           => 'fluentform',
                'recaptcha_enabled' => (bool) get_option('fluentform_recaptcha'),
                'hcaptcha_enabled'  => (bool) get_option('fluentform_hcaptcha'),
                'honeypot_enabled'  => (bool) get_option('fluentform_honeypot'),
                'akismet_enabled'   => (bool) get_option('fluentform_akismet'),
            );
        }

        // Ninja Forms
        if (class_exists('Ninja_Forms')) {
            $nf_settings = get_option('nf_settings');
            $result[] = array(
                'plugin'           => 'ninja-forms',
                'recaptcha_enabled' => !empty($nf_settings['recaptcha']),
                'hcaptcha_enabled'  => !empty($nf_settings['hcaptcha']),
                'honeypot_enabled'  => !empty($nf_settings['honeypot']),
                'akismet_enabled'   => true,
            );
        }

        // Elementor Forms
        if (class_exists('Elementor\Plugin')) {
            $result[] = array(
                'plugin'           => 'elementor',
                'recaptcha_enabled' => (bool) get_option('elementor_control_usage'),
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => false,
            );
        }

        return $result;
    }

    private function has_honeypot() {
        return (bool) get_option('honeypot_enabled', false);
    }

    private function has_gf_recaptcha() {
        $settings = get_option('gf_recaptcha_settings');
        return !empty($settings['site_key']);
    }

    private function has_gf_hcaptcha() {
        $settings = get_option('gf_hcaptcha_settings');
        return !empty($settings['site_key']);
    }

    private function has_gf_honeypot() {
        $forms = \GFFormsModel::get_forms(true);
        foreach ($forms as $form) {
            if (!empty($form['honeypot_enabled'])) {
                return true;
            }
        }
        return false;
    }

    private function get_option($key) {
        $value = get_option($key);
        return $value ?: null;
    }

    private function get_installed_plugins() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $result = array();

        foreach ($plugins as $plugin_path => $plugin) {
            $result[] = array(
                'name'       => $plugin['Name'],
                'slug'       => dirname($plugin_path),
                'version'    => $plugin['Version'],
                'status'     => in_array($plugin_path, $active_plugins) ? 'active' : 'inactive',
                'description' => $plugin['Description'],
            );
        }

        return $result;
    }

    public function get_consent_details() {
        $consent_config = array(
            'cookie_banner_enabled' => (bool) get_option('organic_leads_cookie_banner_enabled', false),
            'consent_mode' => get_option('organic_leads_consent_mode', 'opt_in'),
            'privacy_policy_url' => get_option('organic_leads_privacy_policy_url', ''),
            'terms_url' => get_option('organic_leads_terms_url', ''),
            'cookie_categories' => $this->get_cookie_categories(),
            'consent_management_plugin' => $this->detect_consent_plugin(),
            'consent_banner_text' => get_option('organic_leads_consent_banner_text', ''),
            'consent_button_text' => get_option('organic_leads_consent_button_text', 'Accept All'),
            'data_retention_days' => (int) get_option('organic_leads_data_retention_days', 0),
            'last_updated' => null,
        );

        $last_updated = get_option('organic_leads_consent_last_updated');
        if ($last_updated) {
            $consent_config['last_updated'] = $last_updated;
        }

        return array(
            'consent_config' => $consent_config,
            'synced_at' => current_time('c'),
        );
    }

    private function get_cookie_categories() {
        $defaults = array(
            array('name' => 'necessary', 'label' => 'Necessary', 'description' => 'Essential for the website to function', 'enabled' => true, 'editable' => false),
            array('name' => 'analytics', 'label' => 'Analytics', 'description' => 'Used to understand how visitors interact with the site', 'enabled' => false, 'editable' => true),
            array('name' => 'marketing', 'label' => 'Marketing', 'description' => 'Used to track visitors across websites', 'enabled' => false, 'editable' => true),
            array('name' => 'preferences', 'label' => 'Preferences', 'description' => 'Used to remember your preferences', 'enabled' => false, 'editable' => true),
        );

        $custom = get_option('organic_leads_cookie_categories');
        if ($custom && is_array($custom)) {
            return $custom;
        }

        return $defaults;
    }

    private function detect_consent_plugin() {
        $active_plugins = get_option('active_plugins', array());

        $consent_plugins = array(
            'complianz-gdpr' => 'Complianz GDPR/CCPA',
            'cookieyes' => 'CookieYes',
            'wp-cookie-consent' => 'WP Cookie Consent',
            'borlabs-cookie' => 'Borlabs Cookie',
            'cookiebot' => 'Cookiebot',
        );

        foreach ($active_plugins as $plugin_path) {
            $slug = dirname($plugin_path);
            foreach ($consent_plugins as $search_slug => $label) {
                if (strpos($slug, $search_slug) !== false) {
                    return array(
                        'plugin' => $slug,
                        'name' => $label,
                        'detected' => true,
                    );
                }
            }
        }

        if (get_option('organic_leads_cookie_banner_enabled')) {
            return array(
                'plugin' => 'organic-leads',
                'name' => 'Organic Leads Consent',
                'detected' => true,
            );
        }

        return array(
            'plugin' => null,
            'name' => 'Not detected',
            'detected' => false,
        );
    }

    public function verify_consent() {
        $consent_config = $this->get_consent_details();
        $config = $consent_config['consent_config'];

        $errors = array();
        $warnings = array();

        if (!$config['cookie_banner_enabled']) {
            $warnings[] = 'Cookie banner is not enabled — consent may not be properly collected';
        }

        if (empty($config['privacy_policy_url'])) {
            $warnings[] = 'Privacy policy URL is not set';
        }

        if (empty($config['terms_url'])) {
            $warnings[] = 'Terms of service URL is not set';
        }

        if (empty($config['cookie_categories'])) {
            $errors[] = 'No cookie categories configured';
        } else {
            foreach ($config['cookie_categories'] as $cat) {
                if (!isset($cat['name']) || !isset($cat['label'])) {
                    $errors[] = 'Cookie category is missing name or label';
                    break;
                }
            }
        }

        if (empty($config['consent_mode'])) {
            $errors[] = 'No consent mode configured';
        }

        if (empty($config['data_retention_days'])) {
            $warnings[] = 'No data retention period set — consider setting one for compliance';
        }

        $consent_plugin = $config['consent_management_plugin'];
        if (!$consent_plugin['detected']) {
            $warnings[] = 'No dedicated consent management plugin detected — using site-level consent';
        }

        if (empty($errors)) {
            $status = count($warnings) > 0 ? 'warning' : 'verified';
        } else {
            $status = 'failed';
        }

        return array(
            'consent_config' => $config,
            'verification_status' => $status,
            'errors' => $errors,
            'warnings' => $warnings,
            'last_checked' => current_time('c'),
        );
    }
}
