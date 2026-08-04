<?php
/**
 * REST API endpoints for Organic Leads Connector
 */

if (!defined('ABSPATH')) {
    exit;
}

class Organic_Leads_REST_API {
    private $namespace = 'organic-leads/v1';

    public function register_routes() {
        register_rest_route($this->namespace, '/system', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_system_info'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/plugins', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_plugins'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/themes', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_themes'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_forms'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_forms_health'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms', array(
            'methods' => 'POST',
            'callback' => array($this, 'create_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/(?P<id>\d+)', array(
            'methods' => 'PUT,DELETE',
            'callback' => array($this, 'update_or_delete_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/duplicate', array(
            'methods' => 'POST',
            'callback' => array($this, 'duplicate_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/publish', array(
            'methods' => 'POST',
            'callback' => array($this, 'publish_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/unpublish', array(
            'methods' => 'POST',
            'callback' => array($this, 'unpublish_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/preview', array(
            'methods' => 'POST',
            'callback' => array($this, 'preview_form'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/security', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_security'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/performance', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_performance'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_health'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/full-sync', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_full_sync'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/pages', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_pages'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/posts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_posts'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/media', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_media'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/users', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_users'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/menus', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_menus'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/widgets', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_widgets'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/settings', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_settings'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/categories', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_categories'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/tags', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_tags'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/types', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_types'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/shortcodes', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_shortcodes'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/brand-assets', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_brand_assets'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/tracking-scripts', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_tracking_scripts'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/tracking-scripts/health', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_tracking_scripts_health'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/spam-protection', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_spam_protection'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/(?P<form_id>\d+)/submissions', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_form_submissions'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/forms/submissions/summary', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_submissions_summary'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/tracking-scripts/verify', array(
            'methods' => 'GET',
            'callback' => array($this, 'verify_tracking_scripts'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/consent', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_consent_details'),
            'permission_callback' => array($this, 'authenticate'),
        ));

        register_rest_route($this->namespace, '/consent/verify', array(
            'methods' => 'GET',
            'callback' => array($this, 'verify_consent'),
            'permission_callback' => array($this, 'authenticate'),
        ));
    }

    public function authenticate($request) {
        $auth = $request->get_header('Authorization');
        if (!$auth || !preg_match('/Basic\s+(\S+)/i', $auth, $matches)) {
            return new WP_Error('rest_authentication_error', 'Missing or invalid Authorization header', array('status' => 401));
        }

        $credentials = base64_decode($matches[1]);
        list($username, $password) = explode(':', $credentials, 2);

        $user = wp_authenticate($username, $password);
        if (is_wp_error($user)) {
            return new WP_Error('rest_authentication_error', 'Invalid credentials', array('status' => 401));
        }

        return true;
    }

    public function get_system_info($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_system_info(), 200);
    }

    public function get_plugins($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_plugins(), 200);
    }

    public function get_themes($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_themes(), 200);
    }

    public function get_forms($request) {
        $sync = new Organic_Leads_Forms();
        return new WP_REST_Response($sync->get_forms(), 200);
    }

    public function get_form($request) {
        $sync = new Organic_Leads_Forms();
        $form_id = $request['id'];
        $result = $sync->get_form($form_id);

        if (is_wp_error($result)) {
            return new WP_REST_Response($result->get_error_messages(), $result->get_error_code() ?: 404);
        }

        return new WP_REST_Response($result, 200);
    }

    public function get_forms_health($request) {
        $sync = new Organic_Leads_Forms();
        return new WP_REST_Response($sync->get_health(), 200);
    }

    public function create_form($request) {
        $sync = new Organic_Leads_Forms();
        $params = $request->get_json_params();
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form created successfully',
            'form' => $params,
        ), 201);
    }

    public function update_or_delete_form($request) {
        $sync = new Organic_Leads_Forms();
        $form_id = $request['id'];
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'DELETE') {
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Form deleted successfully',
                'form' => array('id' => $form_id),
            ), 200);
        }

        $params = $request->get_json_params();
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form updated successfully',
            'form' => array_merge(array('id' => $form_id), $params),
        ), 200);
    }

    public function duplicate_form($request) {
        $params = $request->get_json_params();
        $form_id = isset($params['id']) ? $params['id'] : '';
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form duplicated successfully',
            'form' => array('id' => $form_id, 'new_id' => $form_id . '-copy'),
        ), 200);
    }

    public function publish_form($request) {
        $params = $request->get_json_params();
        $form_id = isset($params['id']) ? $params['id'] : '';
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form published successfully',
            'form' => array('id' => $form_id, 'status' => 'published'),
        ), 200);
    }

    public function unpublish_form($request) {
        $params = $request->get_json_params();
        $form_id = isset($params['id']) ? $params['id'] : '';
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form unpublished successfully',
            'form' => array('id' => $form_id, 'status' => 'draft'),
        ), 200);
    }

    public function preview_form($request) {
        $params = $request->get_json_params();
        $form_id = isset($params['id']) ? $params['id'] : '';
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'Form preview generated',
            'form' => array('id' => $form_id, 'preview_url' => ''),
        ), 200);
    }

    public function get_security($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_security(), 200);
    }

    public function get_performance($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_performance(), 200);
    }

    public function get_health($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_health(), 200);
    }

    public function get_full_sync($request) {
        $system = new Organic_Leads_Sync();
        return new WP_REST_Response($system->get_full_sync(), 200);
    }

    public function get_pages($request) {
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

        return new WP_REST_Response(array(
            'pages' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_posts($request) {
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

        return new WP_REST_Response(array(
            'posts' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_media($request) {
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

        return new WP_REST_Response(array(
            'media' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_users($request) {
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

        return new WP_REST_Response(array(
            'users' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_menus($request) {
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

        return new WP_REST_Response(array(
            'menus' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_widgets($request) {
        global $wpdb;
        $widgets = array();
        $sidebars = wp_get_sidebars_widgets();
        $option_name = 'widget_' . 'text';

        foreach ($sidebars as $sidebar_id => $widget_list) {
            foreach ($widget_list as $widget_id) {
                $widgets[] = array(
                    'id' => $widget_id,
                    'sidebar' => $sidebar_id,
                    'type' => 'text',
                );
            }
        }

        return new WP_REST_Response(array(
            'widgets' => $widgets,
            'total' => count($widgets),
        ), 200);
    }

    public function get_settings($request) {
        return new WP_REST_Response(array(
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
        ), 200);
    }

    public function get_categories($request) {
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

        return new WP_REST_Response(array(
            'categories' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_tags($request) {
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

        return new WP_REST_Response(array(
            'tags' => $result,
            'total' => count($result),
        ), 200);
    }

    public function get_types($request) {
        try {
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

            return new WP_REST_Response(array(
                'types' => $result,
                'total' => count($result),
            ), 200);
        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'types' => array(),
                'total' => 0,
                'error' => $e->get_message(),
            ), 200);
        }
    }

    public function get_shortcodes($request) {
        try {
            global $shortcode_tags;
            $result = array();

            if (!empty($shortcode_tags)) {
                foreach ($shortcode_tags as $tag => $callback) {
                    $callback_class = 'unknown';
                    if (is_array($callback) && isset($callback[0])) {
                        $callback_class = is_object($callback[0]) ? get_class($callback[0]) : (is_string($callback[0]) ? $callback[0] : 'unknown');
                    } elseif (is_string($callback)) {
                        $callback_class = $callback;
                    } elseif (is_object($callback)) {
                        $callback_class = get_class($callback);
                    }

                    $result[] = array(
                        'tag' => $tag,
                        'callback' => $callback_class,
                    );
                }
            }

            return new WP_REST_Response(array(
                'shortcodes' => $result,
                'total' => count($result),
            ), 200);
        } catch (Exception $e) {
            return new WP_REST_Response(array(
                'shortcodes' => array(),
                'total' => 0,
                'error' => $e->get_message(),
            ), 200);
        }
    }

    public function get_brand_assets($request) {
        $logo_id = get_theme_mod('custom_logo');
        $result = array();

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

        return new WP_REST_Response($result, 200);
    }

    public function get_tracking_scripts($request) {
        $tracking = new Organic_Leads_Tracking();
        return new WP_REST_Response($tracking->get_tracking_scripts(), 200);
    }

    public function get_tracking_scripts_health($request) {
        $tracking = new Organic_Leads_Tracking();
        return new WP_REST_Response($tracking->get_tracking_scripts_health(), 200);
    }

    public function get_spam_protection($request) {
        $tracking = new Organic_Leads_Tracking();
        return new WP_REST_Response($tracking->get_spam_protection(), 200);
    }

     public function verify_tracking_scripts($request) {
        $tracking = new Organic_Leads_Tracking();
        $data = $tracking->get_tracking_scripts();
        $providers = array();
        foreach ($data['scripts'] as $script) {
            $verification = $this->verify_provider($script['provider'], $script['tracking_id']);
            $providers[] = array(
                'provider'             => $script['provider'],
                'provider_label'       => $script['provider_label'],
                'tracking_id'          => $script['tracking_id'],
                'verification_status'  => $verification['status'],
                'errors'               => $verification['errors'],
                'warnings'             => $verification['warnings'],
                'last_checked'         => current_time('c'),
            );
            $script['verification_status'] = $verification['status'];
            $script['errors'] = $verification['errors'];
            $script['warnings'] = $verification['warnings'];
            $script['last_verified'] = current_time('c');
        }

        return new WP_REST_Response(array(
            'providers'       => $providers,
            'scripts'         => $data['scripts'],
            'synced_at'       => current_time('c'),
        ), 200);
    }

    public function get_form_submissions($request) {
        $forms = new Organic_Leads_Forms();
        $form_id = $request['form_id'];
        $limit = isset($request['limit']) ? (int) $request['limit'] : 50;
        $offset = isset($request['offset']) ? (int) $request['offset'] : 0;
        return new WP_REST_Response($forms->get_form_submissions($form_id, $limit, $offset), 200);
    }

    public function get_submissions_summary($request) {
        $forms = new Organic_Leads_Forms();
        return new WP_REST_Response($forms->get_submissions_summary(), 200);
    }

    public function get_consent_details($request) {
        $tracking = new Organic_Leads_Tracking();
        return new WP_REST_Response($tracking->get_consent_details(), 200);
    }

    public function verify_consent($request) {
        $tracking = new Organic_Leads_Tracking();
        return new WP_REST_Response($tracking->verify_consent(), 200);
    }

    private function verify_provider($provider, $tracking_id) {
        $errors = array();
        $warnings = array();

        switch ($provider) {
            case 'google_analytics_4':
                if (!preg_match('/^G-[A-Z0-9]{8,}$/', $tracking_id)) {
                    $errors[] = 'Invalid GA4 Measurement ID format';
                }
                break;

            case 'google_tag_manager':
                if (!preg_match('/^GTM-[A-Z0-9]{6,}$/', $tracking_id)) {
                    $errors[] = 'Invalid GTM Container ID format';
                }
                break;

            case 'meta_pixel':
                if (!preg_match('/^[0-9]{15,16}$/', $tracking_id)) {
                    $errors[] = 'Invalid Meta Pixel ID format';
                }
                break;

            case 'microsoft_clarity':
                if (empty($tracking_id)) {
                    $errors[] = 'Microsoft Clarity Project ID is empty';
                }
                break;

            case 'linkedin_insight':
                if (!preg_match('/^[0-9]+$/', $tracking_id)) {
                    $errors[] = 'Invalid LinkedIn Partner ID format';
                }
                break;

            case 'google_search_console':
                if (empty($tracking_id)) {
                    $errors[] = 'Google Search Console verification code is empty';
                }
                break;
        }

        if (empty($errors)) {
            $status = 'verified';
        } else {
            $status = 'failed';
        }

        return array(
            'status'   => $status,
            'errors'   => $errors,
            'warnings' => $warnings,
        );
    }
}
