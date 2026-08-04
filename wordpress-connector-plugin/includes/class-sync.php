<?php
/**
 * Data collection and sync logic for Organic Leads Connector
 */

if (!defined('ABSPATH')) {
    exit;
}

class Organic_Leads_Sync {
    public function get_system_info() {
        global $wpdb;

        $db_version = $wpdb->db_version();
        $server_software = isset($_SERVER['SERVER_SOFTWARE']) ? $_SERVER['SERVER_SOFTWARE'] : 'unknown';

        return array(
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => phpversion(),
            'database_version' => $db_version,
            'database_engine' => 'MySQL',
            'server_software' => $server_software,
            'memory_limit' => ini_get('memory_limit'),
            'upload_max_filesize' => ini_get('upload_max_filesize'),
            'post_max_size' => ini_get('post_max_size'),
            'max_execution_time' => (int) ini_get('max_execution_time'),
            'cron_status' => $this->get_cron_status(),
            'debug_mode' => (bool) WP_DEBUG,
            'maintenance_mode' => $this->is_maintenance_mode(),
            'automatic_updates' => $this->get_auto_update_status(),
            'permalink_structure' => get_option('permalink_structure', '/%postname%/'),
            'timezone' => get_option('timezone_string', 'UTC'),
            'language' => get_locale(),
            'rest_api_status' => $this->get_rest_api_status(),
            'xmlrpc_status' => $this->get_xmlrpc_status(),
            'disk_usage' => $this->get_disk_usage(),
            'server_uptime' => $this->get_server_uptime(),
            'site_url' => get_site_url(),
            'home_url' => get_home_url(),
            'admin_url' => get_admin_url(),
            'content_url' => content_url(),
            'includes_url' => includes_url(),
            'plugins_url' => plugins_url(),
            'mu_plugins_url' => WPMU_PLUGIN_URL,
            'upload_dir' => wp_upload_dir()['basedir'],
            'theme' => get_stylesheet(),
            'active_plugins_count' => count(get_option('active_plugins', array())),
            'installed_themes_count' => count(wp_get_themes()),
        );
    }

    public function get_plugins() {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        $active_plugins = get_option('active_plugins', array());
        $result = array();

        foreach ($plugins as $plugin_path => $plugin) {
            $plugin_file = WP_PLUGIN_DIR . '/' . $plugin_path;
            $result[] = array(
                'name' => $plugin['Name'],
                'slug' => dirname($plugin_path),
                'version' => $plugin['Version'],
                'author' => $plugin['AuthorName'],
                'status' => in_array($plugin_path, $active_plugins) ? 'active' : 'inactive',
                'description' => $plugin['Description'],
                'auto_update' => $this->get_plugin_auto_update($plugin_path),
                'update_available' => $this->get_plugin_update($plugin_path),
                'last_updated' => $plugin['LastUpdated'],
            );
        }

        return $result;
    }

    public function get_themes() {
        $themes = wp_get_themes();
        $result = array();

        foreach ($themes as $theme_slug => $theme) {
            $result[] = array(
                'name' => $theme->get('Name'),
                'slug' => $theme_slug,
                'version' => $theme->get('Version'),
                'author' => $theme->get('Author'),
                'status' => $theme->get('Template') === get_template() ? 'active' : 'inactive',
                'description' => $theme->get('Description'),
                'parent_theme' => $theme->get('Template'),
                'is_child_theme' => $theme->get('Template') !== $theme_slug,
                'auto_update' => $this->get_theme_auto_update($theme_slug),
                'update_available' => $this->get_theme_update($theme_slug),
            );
        }

        return $result;
    }

    public function get_security() {
        global $wpdb;

        $security = array(
            'ssl_enabled' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'force_ssl_admin' => (bool) get_option('force_ssl_admin'),
            'ssl_host' => get_option('ssl_host', ''),
            'file_editor_enabled' => wp_get_file_editor_available() !== false,
            'debug_log_enabled' => (bool) WP_DEBUG_LOG,
            'debug_display' => (bool) WP_DEBUG_DISPLAY,
            'external_http_blocked' => (bool) get_option('block_development_creates'),
            'login_attempts' => $this->get_login_attempts(),
            'failed_logins' => $this->get_failed_logins(),
            'last_login_time' => $this->get_last_login_time(),
            'password_reset_enabled' => $this->is_password_reset_enabled(),
            'two_factor_enabled' => $this->is_two_factor_enabled(),
            'xmlrpc_enabled' => $this->get_xmlrpc_status() === 'enabled',
            'rest_api_enabled' => $this->get_rest_api_status() === 'enabled',
        );

        return $security;
    }

    public function get_performance() {
        global $wpdb;

        $performance = array(
            'page_load_time' => $this->estimate_page_load_time(),
            'database_size' => $this->get_database_size(),
            'total_posts' => wp_count_posts()->publish,
            'total_pages' => wp_count_posts('page')->publish,
            'total_comments' => wp_count_comments()->approved,
            'total_users' => count_users()['total_users'],
            'total_media' => $this->get_media_count(),
            'transients_count' => $this->get_transients_count(),
            'revisions_count' => $this->get_revisions_count(),
            'spam_comments' => wp_count_comments()->spam,
            'cached_queries' => $this->get_cached_queries(),
            'object_cache' => wp_using_ext_object_cache(),
            'opcache_enabled' => $this->is_opcache_enabled(),
        );

        return $performance;
    }

    public function get_health() {
        $health = array(
            'wordpress_version_current' => $this->is_wordpress_version_current(),
            'php_version_current' => $this->is_php_version_current(),
            'mysql_version_current' => $this->is_mysql_version_current(),
            'file_system_writable' => $this->is_file_system_writable(),
            'upload_directory_writable' => $this->is_upload_directory_writable(),
            'database_connected' => $this->is_database_connected(),
            'cron_running' => $this->get_cron_status() === 'running',
            'rest_api_working' => $this->get_rest_api_status() === 'enabled',
            'xmlrpc_working' => $this->get_xmlrpc_status() === 'enabled',
            'ssl_configured' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
            'ssl_valid' => $this->is_ssl_valid(),
            'security_headers' => $this->get_security_headers(),
            'outdated_plugins' => $this->count_outdated_plugins(),
            'outdated_themes' => $this->count_outdated_themes(),
            'inactive_plugins' => count(get_option('active_plugins', array())) > 0 ? 0 : 1,
            'debug_mode_enabled' => (bool) WP_DEBUG,
            'maintenance_mode' => $this->is_maintenance_mode(),
        );

        return $health;
    }

    public function get_full_sync() {
        return array(
            'system' => $this->safe_call(array($this, 'get_system_info')),
            'plugins' => $this->safe_call(array($this, 'get_plugins')),
            'themes' => $this->safe_call(array($this, 'get_themes')),
            'forms' => $this->safe_call(array($this, 'get_forms')),
            'tracking_scripts' => $this->safe_call(array($this, 'get_tracking_scripts')),
            'spam_protection' => $this->safe_call(array($this, 'get_spam_protection')),
            'security' => $this->safe_call(array($this, 'get_security')),
            'performance' => $this->safe_call(array($this, 'get_performance')),
            'health' => $this->safe_call(array($this, 'get_health')),
            'pages' => $this->safe_call(array($this, 'get_pages')),
            'posts' => $this->safe_call(array($this, 'get_posts')),
            'media' => $this->safe_call(array($this, 'get_media')),
            'users' => $this->safe_call(array($this, 'get_users')),
            'menus' => $this->safe_call(array($this, 'get_menus')),
            'widgets' => $this->safe_call(array($this, 'get_widgets')),
            'categories' => $this->safe_call(array($this, 'get_categories')),
            'tags' => $this->safe_call(array($this, 'get_tags')),
            'types' => $this->safe_call(array($this, 'get_types')),
            'shortcodes' => $this->safe_call(array($this, 'get_shortcodes')),
            'brand_assets' => $this->safe_call(array($this, 'get_brand_assets')),
            'settings' => $this->safe_call(array($this, 'get_settings')),
            'synced_at' => current_time('c'),
        );
    }

    private function safe_call($callback, $default = array()) {
        try {
            $result = call_user_func($callback);
            return $result ?: $default;
        } catch (Exception $e) {
            return $default;
        }
    }

    public function get_forms() {
        $forms = new Organic_Leads_Forms();
        return $forms->get_forms();
    }

    public function get_tracking_scripts() {
        $tracking = new Organic_Leads_Tracking();
        return $tracking->get_tracking_scripts();
    }

    public function get_spam_protection() {
        $tracking = new Organic_Leads_Tracking();
        return $tracking->get_spam_protection();
    }

    public function get_pages() {
        $pages = get_posts(array(
            'post_type' => 'page',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));

        $result = array();
        foreach ($pages as $page_id) {
            $page = get_post($page_id);
            if (!$page) continue;
            $result[] = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'status' => $page->post_status,
                'author' => get_the_author_meta('display_name', $page->post_author),
                'date' => $page->post_date,
                'modified' => $page->post_modified,
                'content' => $page->post_content,
                'excerpt' => $page->post_excerpt,
                'link' => get_permalink($page),
                'template' => get_page_template_slug($page),
                'parent' => $page->post_parent,
            );
        }

        return array(
            'pages' => $result,
            'total' => count($result),
        );
    }

    public function get_posts() {
        $posts = get_posts(array(
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));

        $result = array();
        foreach ($posts as $post_id) {
            $post = get_post($post_id);
            if (!$post) continue;
            $categories = wp_get_post_categories($post_id, array('fields' => 'names'));
            $tags = wp_get_post_tags($post_id, array('fields' => 'names'));
            $result[] = array(
                'id' => $post->ID,
                'title' => $post->post_title,
                'slug' => $post->post_name,
                'status' => $post->post_status,
                'author' => get_the_author_meta('display_name', $post->post_author),
                'date' => $post->post_date,
                'modified' => $post->post_modified,
                'content' => $post->post_content,
                'excerpt' => $post->post_excerpt,
                'link' => get_permalink($post),
                'categories' => $categories,
                'tags' => $tags,
                'comment_status' => $post->comment_status,
                'ping_status' => $post->ping_status,
            );
        }

        return array(
            'posts' => $result,
            'total' => count($result),
        );
    }

    public function get_media() {
        $media = get_posts(array(
            'post_type' => 'attachment',
            'post_status' => 'inherit',
            'posts_per_page' => -1,
            'fields' => 'ids',
        ));

        $result = array();
        foreach ($media as $media_id) {
            $media_item = get_post($media_id);
            if (!$media_item) continue;
            $meta = wp_get_attachment_metadata($media_id);
            $result[] = array(
                'id' => $media_item->ID,
                'title' => $media_item->post_title,
                'slug' => $media_item->post_name,
                'status' => $media_item->post_status,
                'mime_type' => get_post_mime_type($media_item),
                'url' => wp_get_attachment_url($media_id),
                'link' => get_attachment_link($media_id),
                'author' => get_the_author_meta('display_name', $media_item->post_author),
                'date' => $media_item->post_date,
                'modified' => $media_item->post_modified,
                'width' => isset($meta['width']) ? $meta['width'] : null,
                'height' => isset($meta['height']) ? $meta['height'] : null,
                'file' => get_attached_file($media_id),
            );
        }

        return array(
            'media' => $result,
            'total' => count($result),
        );
    }

    public function get_users() {
        $users = get_users(array(
            'fields' => 'all',
        ));

        $result = array();
        foreach ($users as $user) {
            $result[] = array(
                'id' => $user->ID,
                'name' => $user->display_name,
                'username' => $user->user_login,
                'email' => $user->user_email,
                'role' => implode(', ', $user->roles),
                'registered' => $user->user_registered,
                'last_login' => get_the_author_meta('last_login', $user->ID),
                'posts_count' => count_user_posts($user->ID, 'post', true),
                'url' => $user->user_url,
            );
        }

        return array(
            'users' => $result,
            'total' => count($result),
        );
    }

    public function get_menus() {
        $menus = wp_get_nav_menus();
        $result = array();

        foreach ($menus as $menu) {
            $items = wp_get_nav_menu_items($menu->term_id);
            $menu_items = array();
            if ($items) {
                foreach ($items as $item) {
                    $menu_items[] = array(
                        'id' => $item->ID,
                        'title' => $item->title,
                        'url' => $item->url,
                        'target' => $item->target,
                        'parent' => $item->menu_item_parent,
                        'type' => $item->type,
                        'object_id' => $item->object_id,
                        'object' => $item->object,
                    );
                }
            }
            $result[] = array(
                'id' => $menu->term_id,
                'name' => $menu->name,
                'slug' => $menu->slug,
                'items_count' => count($menu_items),
                'items' => $menu_items,
            );
        }

        return array(
            'menus' => $result,
            'total' => count($result),
        );
    }

    public function get_widgets() {
        global $wpdb;
        $widgets = array();
        $sidebars = wp_get_sidebars_widgets();

        foreach ($sidebars as $sidebar_id => $widget_list) {
            foreach ($widget_list as $widget_id) {
                $widgets[] = array(
                    'id' => $widget_id,
                    'sidebar' => $sidebar_id,
                    'type' => 'text',
                );
            }
        }

        return array(
            'widgets' => $widgets,
            'total' => count($widgets),
        );
    }

    public function get_categories() {
        $categories = get_categories(array(
            'taxonomy' => 'category',
            'hide_empty' => false,
        ));

        $result = array();
        foreach ($categories as $cat) {
            $result[] = array(
                'id' => $cat->term_id,
                'name' => $cat->name,
                'slug' => $cat->slug,
                'description' => $cat->description,
                'count' => $cat->count,
                'parent' => $cat->parent,
                'link' => get_category_link($cat->term_id),
            );
        }

        return array(
            'categories' => $result,
            'total' => count($result),
        );
    }

    public function get_tags() {
        $tags = get_tags(array(
            'taxonomy' => 'post_tag',
            'hide_empty' => false,
        ));

        $result = array();
        foreach ($tags as $tag) {
            $result[] = array(
                'id' => $tag->term_id,
                'name' => $tag->name,
                'slug' => $tag->slug,
                'description' => $tag->description,
                'count' => $tag->count,
                'link' => get_tag_link($tag->term_id),
            );
        }

        return array(
            'tags' => $result,
            'total' => count($result),
        );
    }

    public function get_types() {
        $post_types = get_post_types(array('public' => true), 'objects');
        $result = array();

        foreach ($post_types as $post_type) {
            $count = wp_count_posts($post_type->name);
            $result[] = array(
                'name' => $post_type->name,
                'label' => $post_type->label,
                'description' => $post_type->description,
                'public' => $post_type->public,
                'hierarchical' => $post_type->hierarchical,
                'has_archive' => $post_type->has_archive,
                'show_in_rest' => $post_type->show_in_rest,
                'rest_base' => $post_type->rest_base,
                'total' => isset($count->publish) ? $count->publish : 0,
            );
        }

        return array(
            'types' => $result,
            'total' => count($result),
        );
    }

    public function get_shortcodes() {
        global $shortcode_tags;
        $result = array();

        if (!empty($shortcode_tags)) {
            foreach ($shortcode_tags as $tag => $callback) {
                $result[] = array(
                    'tag' => $tag,
                    'callback' => is_array($callback) ? get_class($callback[0]) : get_class($callback),
                );
            }
        }

        return array(
            'shortcodes' => $result,
            'total' => count($result),
        );
    }

    public function get_brand_assets() {
        $result = array();

        $logo_id = get_theme_mod('custom_logo');
        if ($logo_id) {
            $logo = wp_get_attachment_image_src($logo_id, 'full');
            if ($logo) {
                $result['logo'] = array(
                    'id' => $logo_id,
                    'url' => $logo[0],
                    'width' => $logo[1],
                    'height' => $logo[2],
                );
            }
        }

        $favicon_id = get_option('site_icon');
        if ($favicon_id) {
            $favicon = wp_get_attachment_image_src($favicon_id, 'full');
            if ($favicon) {
                $result['favicon'] = array(
                    'id' => $favicon_id,
                    'url' => $favicon[0],
                    'width' => $favicon[1],
                    'height' => $favicon[2],
                );
            }
        }

        return $result;
    }

    public function get_settings() {
        return array(
            'title' => get_bloginfo('name'),
            'description' => get_bloginfo('description'),
            'url' => get_bloginfo('url'),
            'home' => get_bloginfo('home'),
            'admin_email' => get_option('admin_email'),
            'timezone' => get_option('timezone_string'),
            'permalink_structure' => get_option('permalink_structure'),
            'default_category' => get_option('default_category'),
            'default_post_format' => get_option('default_post_format'),
            'posts_per_page' => get_option('posts_per_page'),
            'default_ping_status' => get_option('default_ping_status'),
            'default_comment_status' => get_option('default_comment_status'),
            'language' => get_locale(),
        );
    }

    private function is_maintenance_mode() {
        $maintenance_file = ABSPATH . '.maintenance';
        return file_exists($maintenance_file);
    }

    private function get_auto_update_status() {
        $auto_updates = get_option('auto_update_plugins', array());
        return !empty($auto_updates);
    }

    private function get_rest_api_status() {
        return 'enabled';
    }

    private function get_xmlrpc_status() {
        $xmlrpc_enabled = get_option('enable_xmlrpc', true);
        return $xmlrpc_enabled ? 'enabled' : 'disabled';
    }

    private function get_disk_usage() {
        $upload_dir = wp_upload_dir()['basedir'];
        if (!is_dir($upload_dir)) {
            return 0;
        }

        $size = 0;
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($upload_dir)) as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return round($size / 1024 / 1024, 2);
    }

    private function get_server_uptime() {
        if (function_exists('exec')) {
            $uptime = @exec('uptime -p');
            if ($uptime) {
                return $uptime;
            }
        }

        if (file_exists('/proc/uptime')) {
            $uptime = file_get_contents('/proc/uptime');
            $seconds = (int) explode(' ', $uptime)[0];
            return gmdate('H:i:s', $seconds);
        }

        return 'unknown';
    }

    private function get_plugin_auto_update($plugin_path) {
        $auto_updates = get_option('auto_update_plugins', array());
        return in_array($plugin_path, $auto_updates);
    }

    private function get_plugin_update($plugin_path) {
        $transient = get_site_transient('update_plugins');
        if (!$transient || !isset($transient->response[$plugin_path])) {
            return false;
        }
        return isset($transient->response[$plugin_path]->new_version);
    }

    private function get_theme_auto_update($theme_slug) {
        $auto_updates = get_option('auto_update_themes', array());
        return in_array($theme_slug, $auto_updates);
    }

    private function get_theme_update($theme_slug) {
        $transient = get_site_transient('update_themes');
        if (!$transient || !isset($transient->response[$theme_slug])) {
            return false;
        }
        return isset($transient->response[$theme_slug]['new_version']);
    }

    private function get_login_attempts() {
        return 0;
    }

    private function get_failed_logins() {
        return 0;
    }

    private function get_last_login_time() {
        $user = wp_get_current_user();
        if ($user->ID) {
            return get_the_author_meta('last_login', $user->ID);
        }
        return null;
    }

    private function is_password_reset_enabled() {
        return true;
    }

    private function is_two_factor_enabled() {
        return false;
    }

    private function estimate_page_load_time() {
        return 0.5;
    }

    private function get_database_size() {
        global $wpdb;
        $size = $wpdb->get_var("SELECT SUM(data_length + index_length) FROM information_schema.TABLES WHERE table_schema = DATABASE()");
        return round($size / 1024 / 1024, 2);
    }

    private function get_media_count() {
        global $wpdb;
        return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_status = 'inherit'");
    }

    private function get_transients_count() {
        global $wpdb;
        return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE '%transient%'");
    }

    private function get_revisions_count() {
        global $wpdb;
        return $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'revision'");
    }

    private function get_cached_queries() {
        if (wp_using_ext_object_cache()) {
            return true;
        }
        return false;
    }

    private function is_opcache_enabled() {
        return function_exists('opcache_get_status') && opcache_get_status();
    }

    private function is_wordpress_version_current() {
        $current = get_bloginfo('version');
        $latest = $this->get_latest_wordpress_version();
        return $current === $latest;
    }

    private function get_latest_wordpress_version() {
        $response = wp_remote_get('https://api.wordpress.org/core/version-check/1.7/');
        if (is_wp_error($response)) {
            return get_bloginfo('version');
        }
        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($body['offers'][0]['current'])) {
            return $body['offers'][0]['current'];
        }
        return get_bloginfo('version');
    }

    private function is_php_version_current() {
        $current = phpversion();
        $latest = $this->get_latest_php_version();
        return version_compare($current, $latest, '>=');
    }

    private function get_latest_php_version() {
        return phpversion();
    }

    private function is_mysql_version_current() {
        global $wpdb;
        $current = $wpdb->db_version();
        $latest = '8.0.0';
        return version_compare($current, $latest, '>=');
    }

    private function is_file_system_writable() {
        return wp_is_writable(ABSPATH);
    }

    private function is_upload_directory_writable() {
        $upload_dir = wp_upload_dir()['basedir'];
        return wp_is_writable($upload_dir);
    }

    private function is_database_connected() {
        global $wpdb;
        return $wpdb->check_connection();
    }

    private function is_ssl_valid() {
        if (!isset($_SERVER['HTTPS']) || $_SERVER['HTTPS'] !== 'on') {
            return false;
        }

        $context = stream_context_create(array(
            'ssl' => array(
                'verify_peer' => true,
                'verify_peer_name' => true,
            ),
        ));

        $url = get_site_url();
        $stream = @fopen($url, 'r', false, $context);
        if ($stream) {
            fclose($stream);
            return true;
        }

        return false;
    }

    private function get_security_headers() {
        $headers = array();
        if (function_exists('headers_sent')) {
            $headers['x_content_type_options'] = 'nosniff';
            $headers['x_frame_options'] = 'SAMEORIGIN';
        }
        return $headers;
    }

    private function count_outdated_plugins() {
        $transient = get_site_transient('update_plugins');
        if (!$transient || !isset($transient->response)) {
            return 0;
        }
        return count($transient->response);
    }

    private function count_outdated_themes() {
        $transient = get_site_transient('update_themes');
        if (!$transient || !isset($transient->response)) {
            return 0;
        }
        return count($transient->response);
    }
}
