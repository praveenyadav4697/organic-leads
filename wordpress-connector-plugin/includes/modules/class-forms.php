<?php
/**
 * Forms data collection and sync logic for Organic Leads Connector
 */

if (!defined('ABSPATH')) {
    exit;
}

class Organic_Leads_Forms {
    private $supported_plugins = array(
        'contact-form-7',
        'wpforms',
        'gravityforms',
        'fluentform',
        'ninja-forms',
        'formidable',
        'elementor',
        'everest-forms',
        'happyforms',
        'custom-html',
    );

    public function get_forms() {
        $forms = array();
        $forms = array_merge($forms, $this->get_contact_form7());
        $forms = array_merge($forms, $this->get_wpforms());
        $forms = array_merge($forms, $this->get_gravityforms());
        $forms = array_merge($forms, $this->get_fluentforms());
        $forms = array_merge($forms, $this->get_ninjaforms());
        $forms = array_merge($forms, $this->get_formidableforms());
        $forms = array_merge($forms, $this->get_elementor_forms());
        $forms = array_merge($forms, $this->get_everestforms());
        $forms = array_merge($forms, $this->get_happyforms());
        $forms = array_merge($forms, $this->get_custom_html_forms());

        $spam_config = $this->get_spam_protection_config();

        foreach ($forms as &$form) {
            $plugin_slug = $form['plugin'];
            $form['spam_protection'] = $spam_config[$plugin_slug] ?? $this->get_default_spam_config();
            $form['destinations'] = $this->get_form_destinations($plugin_slug, $form['id']);
            $form['last_modified'] = $form['updated_at'] ?: $form['created_at'];
        }
        unset($form);

        return array(
            'forms' => $forms,
            'total' => count($forms),
            'synced_at' => current_time('c'),
        );
    }

    private function get_default_spam_config() {
        return array(
            'recaptcha_enabled' => false,
            'recaptcha_type'    => null,
            'hcaptcha_enabled'  => false,
            'honeypot_enabled'  => false,
            'akismet_enabled'   => false,
            'spam_score'        => 'unknown',
        );
    }

    private function get_spam_protection_config() {
        $config = array();

        // Contact Form 7 — reCAPTCHA via CF7 settings
        if (class_exists('WPCF7_ContactForm') && class_exists('WPCF7_ContactFormFactory')) {
            $recaptcha = get_option('wpcf7_recaptcha');
            $config['contact-form-7'] = array(
                'recaptcha_enabled' => !empty($recaptcha['sitekey']) || !empty($recaptcha['api_key']),
                'recaptcha_type'    => !empty($recaptcha['invisible']) ? 'v3' : 'v2',
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => true,
                'spam_score'        => 'unknown',
            );
        }

        // WPForms — reCAPTCHA and honeypot via WPForms settings
        if (class_exists('WPForms')) {
            $recaptcha = get_option('wpforms_recaptcha');
            $honeypot = get_option('wpforms_honeypot');
            $config['wpforms'] = array(
                'recaptcha_enabled' => !empty($recaptcha),
                'recaptcha_type'    => !empty($recaptcha['type']) ? $recaptcha['type'] : 'v2',
                'hcaptcha_enabled'  => !empty($recaptcha['hcaptcha']),
                'honeypot_enabled'  => !empty($honeypot),
                'akismet_enabled'   => false,
                'spam_score'        => 'unknown',
            );
        }

        // Gravity Forms
        if (class_exists('GFForms')) {
            $gf_recaptcha = $this->get_gf_recaptcha_settings();
            $config['gravityforms'] = array(
                'recaptcha_enabled' => !empty($gf_recaptcha['site_key']),
                'recaptcha_type'    => !empty($gf_recaptcha['type']) ? $gf_recaptcha['type'] : 'v2',
                'hcaptcha_enabled'  => !empty($gf_recaptcha['hcaptcha']),
                'honeypot_enabled'  => true,
                'akismet_enabled'   => false,
                'spam_score'        => 'unknown',
            );
        }

        // Fluent Forms
        if (class_exists('FluentForm\Framework\Foundation\Application')) {
            $ff_recaptcha = get_option('fluentform_recaptcha');
            $ff_hcaptcha = get_option('fluentform_hcaptcha');
            $ff_honeypot = get_option('fluentform_honeypot');
            $ff_akismet = get_option('fluentform_akismet');
            $config['fluentform'] = array(
                'recaptcha_enabled' => !empty($ff_recaptcha),
                'recaptcha_type'    => !empty($ff_recaptcha['type']) ? $ff_recaptcha['type'] : 'v2',
                'hcaptcha_enabled'  => !empty($ff_hcaptcha),
                'honeypot_enabled'  => !empty($ff_honeypot),
                'akismet_enabled'   => !empty($ff_akismet),
                'spam_score'        => 'unknown',
            );
        }

        // Ninja Forms
        if (class_exists('Ninja_Forms')) {
            $nf_settings = get_option('nf_settings');
            $config['ninja-forms'] = array(
                'recaptcha_enabled' => !empty($nf_settings['recaptcha']),
                'recaptcha_type'    => !empty($nf_settings['recaptcha_version']) ? $nf_settings['recaptcha_version'] : 'v2',
                'hcaptcha_enabled'  => !empty($nf_settings['hcaptcha']),
                'honeypot_enabled'  => !empty($nf_settings['honeypot']),
                'akismet_enabled'   => !empty($nf_settings['akismet']),
                'spam_score'        => 'unknown',
            );
        }

        // Formidable Forms
        if (class_exists('FrmForm')) {
            $config['formidable'] = array(
                'recaptcha_enabled' => (bool) get_option('frm_settings_recaptcha'),
                'recaptcha_type'    => 'v2',
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => true,
                'spam_score'        => 'unknown',
            );
        }

        // Elementor Forms
        if (class_exists('Elementor\Plugin')) {
            $config['elementor'] = array(
                'recaptcha_enabled' => (bool) get_option('elementor_control_usage'),
                'recaptcha_type'    => 'v2',
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => false,
                'spam_score'        => 'unknown',
            );
        }

        // Everest Forms
        if (class_exists('EverestForms')) {
            $config['everest-forms'] = array(
                'recaptcha_enabled' => (bool) get_option('everest_forms_recaptcha'),
                'recaptcha_type'    => 'v2',
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => false,
                'spam_score'        => 'unknown',
            );
        }

        // Happy Forms
        if (class_exists('HappyForms')) {
            $config['happyforms'] = array(
                'recaptcha_enabled' => (bool) get_option('happyforms_recaptcha'),
                'recaptcha_type'    => 'v2',
                'hcaptcha_enabled'  => false,
                'honeypot_enabled'  => false,
                'akismet_enabled'   => false,
                'spam_score'        => 'unknown',
            );
        }

        // Custom HTML
        $config['custom-html'] = $this->get_default_spam_config();

        return $config;
    }

    private function get_gf_recaptcha_settings() {
        if (class_exists('GFFormTagHelper')) {
            $settings = rgars(GFFormsModel::get_form_settings(), 'recaptcha_settings');
            if ($settings) {
                return $settings;
            }
        }
        $settings = get_option('gf_recaptcha_settings');
        return $settings ?: array();
    }

    private function get_form_destinations($plugin, $form_id) {
        $destinations = array();

        if ($plugin === 'contact-form-7') {
            if (class_exists('WPCF7_ContactForm') && class_exists('WPCF7_ContactFormFactory')) {
                $form = WPCF7_ContactForm::find(array('id' => $form_id));
                if ($form) {
                    $mail = $form->prop('mail');
                    if (!empty($mail)) {
                        foreach ($mail as $m) {
                            if (!empty($m['to'])) {
                                $destinations[] = array(
                                    'type'    => 'email',
                                    'address' => $m['to'],
                                    'label'   => 'Primary',
                                );
                            }
                        }
                    }
                }
            }
        }

        if ($plugin === 'wpforms') {
            global $wpdb;
            $meta = $wpdb->get_var($wpdb->prepare(
                "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_wpforms_form_meta'",
                $form_id
            ));
            if ($meta) {
                $form_meta = json_decode($meta, true);
                if (!empty($form_meta['settings']['emails'])) {
                    foreach ($form_meta['settings']['emails'] as $email) {
                        if (!empty($email['to'])) {
                            $email_parts = explode(',', $email['to']);
                            foreach ($email_parts as $addr) {
                                $addr = trim($addr);
                                if (!empty($addr)) {
                                    $destinations[] = array(
                                        'type'    => 'email',
                                        'address' => $addr,
                                        'label'   => !empty($email['label']) ? $email['label'] : 'Primary',
                                    );
                                }
                            }
                        }
                    }
                }
            }
        }

        if ($plugin === 'gravityforms') {
            if (class_exists('GFFormsModel')) {
                $form_obj = GFAPI::get_form($form_id);
                if ($form_obj && !empty($form_obj['notifications'])) {
                    foreach ($form_obj['notifications'] as $notification) {
                        if (!empty($notification['toType']) && $notification['toType'] === 'email') {
                            if (!empty($notification['to'])) {
                                $destinations[] = array(
                                    'type'    => 'email',
                                    'address' => $notification['to'],
                                    'label'   => !empty($notification['name']) ? $notification['name'] : 'Primary',
                                );
                            }
                        }
                    }
                }
            }
        }

        if ($plugin === 'fluentform') {
            if (class_exists('FluentForm\Framework\Foundation\Application')) {
                $form = FluentForm::find($form_id, ['notifications']);
                if ($form && !empty($form->notifications)) {
                    foreach ($form->notifications as $notification) {
                        if (!empty($notification['to_email'])) {
                            $destinations[] = array(
                                'type'    => 'email',
                                'address' => $notification['to_email'],
                                'label'   => !empty($notification['name']) ? $notification['name'] : 'Primary',
                            );
                        }
                    }
                }
            }
        }

        if ($plugin === 'ninja-forms') {
            $settings = ninja_forms_form_settings($form_id);
            if (!empty($settings['notification_email'])) {
                $destinations[] = array(
                    'type'    => 'email',
                    'address' => $settings['notification_email'],
                    'label'   => 'Primary',
                );
            }
        }

        if ($plugin === 'formidable') {
            if (class_exists('FrmForm')) {
                $form = FrmForm::getOne($form_id);
                if ($form && !empty($form->actions)) {
                    foreach ($form->actions as $action) {
                        if (!empty($action->post_content['email_to'])) {
                            $destinations[] = array(
                                'type'    => 'email',
                                'address' => $action->post_content['email_to'],
                                'label'   => !empty($action->name) ? $action->name : 'Primary',
                            );
                        }
                    }
                }
            }
        }

        if (empty($destinations)) {
            $destinations[] = array(
                'type'    => 'email',
                'address' => '',
                'label'   => 'Not configured',
            );
        }

        return $destinations;
    }

    public function get_form($form_id) {
        $forms = $this->get_forms();
        foreach ($forms['forms'] as $form) {
            if ((string) $form['id'] === (string) $form_id) {
                return $form;
            }
        }

        return new WP_Error('organic_leads_form_not_found', 'Form not found', array('status' => 404));
    }

    public function get_health() {
        $forms = $this->get_forms();
        $total = count($forms['forms']);
        $published = 0;
        $draft = 0;
        $broken = 0;
        $spam_protected = 0;
        $no_spam_protection = 0;

        foreach ($forms['forms'] as $form) {
            $status = $form['status'];
            if ($status === 'published') {
                $published++;
            } elseif ($status === 'draft') {
                $draft++;
            }

            if (empty($form['shortcode']) || empty($form['fields'])) {
                $broken++;
            }

            $spam = $form['spam_protection'] ?? array();
            if (!empty($spam['recaptcha_enabled']) || !empty($spam['hcaptcha_enabled']) || !empty($spam['honeypot_enabled']) || !empty($spam['akismet_enabled'])) {
                $spam_protected++;
            } else {
                $no_spam_protection++;
            }
        }

        return array(
            'total_forms'           => $total,
            'published_forms'       => $published,
            'draft_forms'           => $draft,
            'broken_forms'          => $broken,
            'spam_protected_forms'  => $spam_protected,
            'unprotected_forms'     => $no_spam_protection,
            'synced_at'             => current_time('c'),
        );
    }

    public function get_submissions_summary() {
        $forms = $this->get_forms();
        $summary = array();
        $total_submissions = 0;
        $total_sent = 0;
        $total_failed = 0;

        foreach ($forms['forms'] as $form) {
            $submissions = $this->get_form_submissions($form['id'], 0, 0);
            $form_total = $submissions['total'];
            $form_sent = 0;
            $form_failed = 0;

            foreach ($submissions['submissions'] as $s) {
                if ($s['status'] === 'sent' || $s['status'] === 'delivered') {
                    $form_sent++;
                }
                if ($s['status'] === 'failed' || $s['status'] === 'spamming') {
                    $form_failed++;
                }
            }

            $summary[] = array(
                'form_id' => $form['id'],
                'form_name' => $form['name'],
                'plugin' => $form['plugin'],
                'total' => $form_total,
                'sent' => $form_sent,
                'failed' => $form_failed,
            );

            $total_submissions += $form_total;
            $total_sent += $form_sent;
            $total_failed += $form_failed;
        }

        return array(
            'submissions' => $summary,
            'total_submissions' => $total_submissions,
            'total_sent' => $total_sent,
            'total_failed' => $total_failed,
            'synced_at' => current_time('c'),
        );
    }

    private function get_contact_form7() {
        if (!class_exists('WPCF7_ContactForm') || !class_exists('WPCF7_ContactFormFactory')) {
            return array();
        }

        $forms = array();
        $cf7 = WPCF7_ContactForm::find(array('status' => null));

        if (empty($cf7)) {
            return $forms;
        }

        foreach ($cf7 as $contact_form) {
            $form_id = $contact_form->id();
            $title = $contact_form->title();
            $status = $contact_form->status === 'publish' ? 'published' : 'draft';

            $fields = array();
            $tags = $contact_form->scan_form_tags();
            foreach ($tags as $tag) {
                $fields[] = array(
                    'type' => $tag->type,
                    'name' => $tag->name,
                    'required' => $tag->is_required(),
                );
            }

            $forms[] = array(
                'id' => (string) $form_id,
                'plugin' => 'contact-form-7',
                'name' => $title,
                'description' => '',
                'status' => $status,
                'shortcode' => '[contact-form-7 id="' . $form_id . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => '',
                'updated_at' => '',
            );
        }

        return $forms;
    }

    private function get_wpforms() {
        if (!class_exists('WPForms')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'wpforms';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") === $table) {
            $results = $wpdb->get_results("SELECT id, post_title, post_status, post_modified FROM $table", ARRAY_A);
            foreach ($results as $row) {
                $fields = $this->get_wpforms_fields($row['id']);
                $forms[] = array(
                    'id' => (string) $row['id'],
                    'plugin' => 'wpforms',
                    'name' => $row['post_title'],
                    'description' => '',
                    'status' => $row['post_status'] === 'publish' ? 'published' : 'draft',
                    'shortcode' => '[wpforms id="' . $row['id'] . '"]',
                    'fields' => $fields,
                    'fields_count' => count($fields),
                    'entries_count' => null,
                    'health' => 'healthy',
                    'responsive' => true,
                    'auto_update_enabled' => false,
                    'created_at' => '',
                    'updated_at' => $row['post_modified'],
                );
            }

            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT ID, post_title, post_status, post_modified FROM {$wpdb->posts} WHERE post_type = 'wpforms' AND post_status IN ('publish', 'draft')",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_wpforms_fields_cpt($row['ID']);
            $forms[] = array(
                'id' => (string) $row['ID'],
                'plugin' => 'wpforms',
                'name' => $row['post_title'],
                'description' => '',
                'status' => $row['post_status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[wpforms id="' . $row['ID'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => '',
                'updated_at' => $row['post_modified'],
            );
        }

        return $forms;
    }

    private function get_wpforms_fields_cpt($form_id) {
        global $wpdb;
        $fields = array();
        $meta = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_wpforms_form_meta'",
            $form_id
        ));

        if (!$meta) {
            return $fields;
        }

        $form_meta = json_decode($meta, true);
        if (empty($form_meta['fields'])) {
            return $fields;
        }

        foreach ($form_meta['fields'] as $field) {
            $fields[] = array(
                'type' => isset($field['type']) ? $field['type'] : 'text',
                'name' => isset($field['label']) ? $field['label'] : (isset($field['name']) ? $field['name'] : ''),
                'required' => !empty($field['required']),
            );
        }

        return $fields;
    }

    private function get_wpforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'wpforms_entries_fields';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT field_id, name, type, required FROM $table WHERE form_id = %d GROUP BY field_id, name, type, required",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['name'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    private function get_gravityforms() {
        if (!class_exists('GFForms')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'gf_form';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results("SELECT id, title, is_active, date_created, date_updated FROM $table", ARRAY_A);

        foreach ($results as $row) {
            $fields = $this->get_gravityforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'gravityforms',
                'name' => $row['title'],
                'description' => '',
                'status' => $row['is_active'] ? 'published' : 'draft',
                'shortcode' => '[gravityform id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['date_created'],
                'updated_at' => $row['date_updated'],
            );
        }

        return $forms;
    }

    private function get_gravityforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'gf_form_meta';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $meta = $wpdb->get_row($wpdb->prepare(
            "SELECT display_meta FROM $table WHERE form_id = %d",
            $form_id
        ));

        if ($meta && !empty($meta->display_meta)) {
            $form_meta = json_decode($meta->display_meta, true);
            if (!empty($form_meta['fields'])) {
                foreach ($form_meta['fields'] as $field) {
                    $fields[] = array(
                        'type' => isset($field['type']) ? $field['type'] : 'text',
                        'name' => isset($field['label']) ? $field['label'] : '',
                        'required' => !empty($field['isRequired']),
                    );
                }
            }
        }

        return $fields;
    }

    private function get_fluentforms() {
        if (!class_exists('FluentForm\Framework\Foundation\Application')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'fluentform_forms';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT id, title, status, created_at, updated_at FROM $table",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_fluentforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'fluentform',
                'name' => $row['title'],
                'description' => '',
                'status' => $row['status'] === 'published' ? 'published' : 'draft',
                'shortcode' => '[fluentform id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            );
        }

        return $forms;
    }

    private function get_fluentforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'fluentform_form_fields';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT name, type, required FROM $table WHERE form_id = %d",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['name'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    private function get_ninjaforms() {
        if (!class_exists('Ninja_Forms')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'nf3_forms';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT id, title, status, created_at, updated_at FROM $table",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_ninjaforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'ninja-forms',
                'name' => $row['title'],
                'description' => '',
                'status' => $row['status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[ninja_form id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            );
        }

        return $forms;
    }

    private function get_ninjaforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'nf3_fields';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT name, type, required FROM $table WHERE form_id = %d",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['name'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    private function get_formidableforms() {
        if (!class_exists('FrmForm')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'frm_forms';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT id, name, status, form_key, created_at, updated_at FROM $table",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_formidableforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'formidable',
                'name' => $row['name'],
                'description' => '',
                'status' => $row['status'] === 'published' ? 'published' : 'draft',
                'shortcode' => '[formidable id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            );
        }

        return $forms;
    }

    private function get_formidableforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'frm_fields';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT name, type, required FROM $table WHERE form_id = %d",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['name'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    private function get_elementor_forms() {
        if (!class_exists('Elementor\Plugin')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $posts_table = $wpdb->posts;
        $meta_table = $wpdb->postmeta;

        $results = $wpdb->get_results(
            "SELECT p.ID, p.post_title, p.post_status, p.post_modified
             FROM $posts_table AS p
             INNER JOIN $meta_table AS pm ON p.ID = pm.post_id
             WHERE p.post_type = 'elementor_library'
             AND pm.meta_key = '_elementor_template_type'
             AND pm.meta_value = 'forms'
             AND p.post_status IN ('publish', 'draft')",
            ARRAY_A
        );

        foreach ($results as $row) {
            $forms[] = array(
                'id' => (string) $row['ID'],
                'plugin' => 'elementor',
                'name' => $row['post_title'],
                'description' => '',
                'status' => $row['post_status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[elementor-template id="' . $row['ID'] . '"]',
                'fields' => array(),
                'fields_count' => 0,
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => '',
                'updated_at' => $row['post_modified'],
            );
        }

        return $forms;
    }

    private function get_everestforms() {
        if (!class_exists('EverestForms')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'evf_forms';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT id, name, status, created_at, updated_at FROM $table",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_everestforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'everest-forms',
                'name' => $row['name'],
                'description' => '',
                'status' => $row['status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[everest_form id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            );
        }

        return $forms;
    }

    private function get_everestforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'evf_fields';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT name, type, required FROM $table WHERE form_id = %d",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['name'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    private function get_happyforms() {
        if (!class_exists('HappyForms')) {
            return array();
        }

        global $wpdb;
        $forms = array();
        $table = $wpdb->prefix . 'happyforms_form';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $forms;
        }

        $results = $wpdb->get_results(
            "SELECT id, title, status, created_at, updated_at FROM $table",
            ARRAY_A
        );

        foreach ($results as $row) {
            $fields = $this->get_happyforms_fields($row['id']);
            $forms[] = array(
                'id' => (string) $row['id'],
                'plugin' => 'happyforms',
                'name' => $row['title'],
                'description' => '',
                'status' => $row['status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[happyforms id="' . $row['id'] . '"]',
                'fields' => $fields,
                'fields_count' => count($fields),
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            );
        }

        return $forms;
    }

    private function get_happyforms_fields($form_id) {
        global $wpdb;
        $fields = array();
        $table = $wpdb->prefix . 'happyforms_form_field';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $fields;
        }

        $results = $wpdb->get_results($wpdb->prepare(
            "SELECT label, type, required FROM $table WHERE form_id = %d",
            $form_id
        ), ARRAY_A);

        foreach ($results as $row) {
            $fields[] = array(
                'type' => $row['type'],
                'name' => $row['label'],
                'required' => (bool) $row['required'],
            );
        }

        return $fields;
    }

    public function get_form_submissions($form_id, $limit = 50, $offset = 0) {
        $submissions = array();
        $forms = $this->get_forms();
        $form = null;

        foreach ($forms['forms'] as $f) {
            if ((string) $f['id'] === (string) $form_id) {
                $form = $f;
                break;
            }
        }

        if (!$form) {
            return array(
                'submissions' => array(),
                'total' => 0,
                'form_id' => $form_id,
                'form_name' => null,
                'synced_at' => current_time('c'),
            );
        }

        $plugin = $form['plugin'];

        if ($plugin === 'contact-form-7') {
            $submissions = $this->get_cf7_submissions($form_id, $limit, $offset);
        } elseif ($plugin === 'wpforms') {
            $submissions = $this->get_wpforms_submissions($form_id, $limit, $offset);
        } elseif ($plugin === 'gravityforms') {
            $submissions = $this->get_gravityforms_submissions($form_id, $limit, $offset);
        } elseif ($plugin === 'fluentform') {
            $submissions = $this->get_fluentform_submissions($form_id, $limit, $offset);
        } elseif ($plugin === 'ninja-forms') {
            $submissions = $this->get_ninjaforms_submissions($form_id, $limit, $offset);
        } elseif ($plugin === 'formidable') {
            $submissions = $this->get_formidable_submissions($form_id, $limit, $offset);
        }

        $total = count($submissions);

        return array(
            'submissions' => $submissions,
            'total' => $total,
            'form_id' => $form_id,
            'form_name' => $form['name'],
            'plugin' => $plugin,
            'synced_at' => current_time('c'),
        );
    }

    private function get_cf7_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $table = $wpdb->prefix . 'cf7dbplugin_entry';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table WHERE form_id = %d ORDER BY created DESC LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        foreach ($rows as $row) {
            $submissions[] = array(
                'id' => $row['id'],
                'form_id' => $form_id,
                'plugin' => 'contact-form-7',
                'status' => 'sent',
                'submitted_at' => $row['created'] ?? null,
                'visitor_ip' => $row['ip'] ?? null,
                'submission_data' => $row['data'] ?? null,
                'destination_type' => 'email',
                'destination_address' => $this->get_cf7_destination($form_id),
            );
        }

        return $submissions;
    }

    private function get_cf7_destination($form_id) {
        if (!class_exists('WPCF7_ContactForm')) {
            return null;
        }
        $form = WPCF7_ContactForm::find(array('id' => $form_id));
        if (!$form) {
            return null;
        }
        $mail = $form->prop('mail');
        if (!empty($mail)) {
            foreach ($mail as $m) {
                if (!empty($m['to'])) {
                    return $m['to'];
                }
            }
        }
        return null;
    }

    private function get_wpforms_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $entries_table = $wpdb->prefix . 'wpforms_entries';

        if ($wpdb->get_var("SHOW TABLES LIKE '$entries_table'") !== $entries_table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.id, e.date_created, e.status, e.user_ip, f.fields as fields_data
             FROM $entries_table e
             LEFT JOIN {$wpdb->prefix}wpforms_entry_fields f ON e.id = f.entry_id
             WHERE e.form_id = %d
             ORDER BY e.date_created DESC
             LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        $meta_table = $wpdb->prefix . 'wpforms_forms';
        $destinations = array();
        $meta = $wpdb->get_var($wpdb->prepare(
            "SELECT meta_value FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key = '_wpforms_form_meta'",
            $form_id
        ));
        if ($meta) {
            $form_meta = json_decode($meta, true);
            if (!empty($form_meta['settings']['emails'])) {
                foreach ($form_meta['settings']['emails'] as $email) {
                    if (!empty($email['to'])) {
                        $email_parts = explode(',', $email['to']);
                        foreach ($email_parts as $addr) {
                            $destinations[] = array(
                                'type' => 'email',
                                'address' => trim($addr),
                                'label' => !empty($email['label']) ? $email['label'] : 'Primary',
                            );
                        }
                    }
                }
            }
        }

        foreach ($rows as $row) {
            $data = array();
            if (!empty($row['fields_data'])) {
                $field_rows = $wpdb->get_results($wpdb->prepare(
                    "SELECT field_id, value FROM {$wpdb->prefix}wpforms_entry_fields WHERE entry_id = %d",
                    $row['id']
                ), ARRAY_A);
                foreach ($field_rows as $fr) {
                    $data[$fr['field_id']] = $fr['value'];
                }
            }

            $submissions[] = array(
                'id' => 'wpforms_' . $row['id'],
                'form_id' => $form_id,
                'plugin' => 'wpforms',
                'status' => isset($row['status']) ? ($row['status'] === 'abandoned-cart' ? 'failed' : 'sent') : 'sent',
                'submitted_at' => $row['date_created'] ?? null,
                'visitor_ip' => $row['user_ip'] ?? null,
                'submission_data' => $data,
                'destination_type' => 'email',
                'destination_address' => isset($destinations[0]['address']) ? $destinations[0]['address'] : null,
            );
        }

        return $submissions;
    }

    private function get_gravityforms_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $table = $wpdb->prefix . 'gf_entry';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.id, e.date_created, e.status, e.ip, e.user_agent
             FROM $table e
             WHERE e.form_id = %d
             ORDER BY e.date_created DESC
             LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        $form_obj = GFAPI::get_form($form_id);
        $destinations = array();
        if ($form_obj && !empty($form_obj['notifications'])) {
            foreach ($form_obj['notifications'] as $notification) {
                if (!empty($notification['toType']) && $notification['toType'] === 'email') {
                    if (!empty($notification['to'])) {
                        $destinations[] = array(
                            'type' => 'email',
                            'address' => $notification['to'],
                            'label' => !empty($notification['name']) ? $notification['name'] : 'Primary',
                        );
                    }
                }
            }
        }

        foreach ($rows as $row) {
            $entry = GFAPI::get_entry($row['id']);
            $data = array();
            if ($entry && !is_wp_error($entry)) {
                foreach ($entry as $key => $value) {
                    if (strpos($key, 'input') === 0 || is_string($key)) {
                        $data[$key] = $value;
                    }
                }
            }

            $submissions[] = array(
                'id' => 'gf_' . $row['id'],
                'form_id' => $form_id,
                'plugin' => 'gravityforms',
                'status' => isset($row['status']) ? ($row['status'] === 'active' ? 'sent' : $row['status']) : 'sent',
                'submitted_at' => $row['date_created'] ?? null,
                'visitor_ip' => $row['ip'] ?? null,
                'visitor_user_agent' => $row['user_agent'] ?? null,
                'submission_data' => $data,
                'destination_type' => 'email',
                'destination_address' => isset($destinations[0]['address']) ? $destinations[0]['address'] : null,
            );
        }

        return $submissions;
    }

    private function get_fluentform_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $table = $wpdb->prefix . 'fluentform_entries';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.id, e.created_at, e.status, e.ip, e.user_agent
             FROM $table e
             WHERE e.form_id = %d
             ORDER BY e.created_at DESC
             LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        $notifications = FluentForm::find($form_id, ['notifications']);
        $destinations = array();
        if ($notifications && !empty($notifications->notifications)) {
            foreach ($notifications->notifications as $notification) {
                if (!empty($notification['to_email'])) {
                    $destinations[] = array(
                        'type' => 'email',
                        'address' => $notification['to_email'],
                        'label' => !empty($notification['name']) ? $notification['name'] : 'Primary',
                    );
                }
            }
        }

        foreach ($rows as $row) {
            $data = array();
            $entries_data = $wpdb->get_results($wpdb->prepare(
                "SELECT label, raw_value FROM {$wpdb->prefix}fluentform_entry_details WHERE entry_id = %d",
                $row['id']
            ), ARRAY_A);
            foreach ($entries_data as $ed) {
                $data[$ed['label']] = $ed['raw_value'];
            }

            $submissions[] = array(
                'id' => 'ff_' . $row['id'],
                'form_id' => $form_id,
                'plugin' => 'fluentform',
                'status' => isset($row['status']) ? $row['status'] : 'sent',
                'submitted_at' => $row['created_at'] ?? null,
                'visitor_ip' => $row['ip'] ?? null,
                'visitor_user_agent' => $row['user_agent'] ?? null,
                'submission_data' => $data,
                'destination_type' => 'email',
                'destination_address' => isset($destinations[0]['address']) ? $destinations[0]['address'] : null,
            );
        }

        return $submissions;
    }

    private function get_ninjaforms_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $table = $wpdb->prefix . 'nf3_entries';

        if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.id, e.date_created, e.status, e.user_ip
             FROM $table e
             WHERE e.form_id = %d
             ORDER BY e.date_created DESC
             LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        $settings = ninja_forms_form_settings($form_id);
        $dest_addr = isset($settings['notification_email']) ? $settings['notification_email'] : null;

        foreach ($rows as $row) {
            $data = array();
            $field_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT field_id, value FROM {$wpdb->prefix}nf3_entry_meta WHERE entry_id = %d",
                $row['id']
            ), ARRAY_A);
            foreach ($field_rows as $fr) {
                $data[$fr['field_id']] = $fr['value'];
            }

            $submissions[] = array(
                'id' => 'nf_' . $row['id'],
                'form_id' => $form_id,
                'plugin' => 'ninja-forms',
                'status' => isset($row['status']) ? $row['status'] : 'sent',
                'submitted_at' => $row['date_created'] ?? null,
                'visitor_ip' => $row['user_ip'] ?? null,
                'submission_data' => $data,
                'destination_type' => 'email',
                'destination_address' => $dest_addr,
            );
        }

        return $submissions;
    }

    private function get_formidable_submissions($form_id, $limit, $offset) {
        global $wpdb;
        $submissions = array();
        $entries_table = $wpdb->prefix . 'frm_item';

        if ($wpdb->get_var("SHOW TABLES LIKE '$entries_table'") !== $entries_table) {
            return $submissions;
        }

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT e.id, e.created_at, e.status, e.user_ip
             FROM $entries_table e
             WHERE e.form_id = %d
             ORDER BY e.created_at DESC
             LIMIT %d OFFSET %d",
            $form_id, $limit, $offset
        ), ARRAY_A);

        $form = FrmForm::getOne($form_id);
        $dest_address = null;
        if ($form && !empty($form->actions)) {
            foreach ($form->actions as $action) {
                if (!empty($action->post_content['email_to'])) {
                    $dest_address = $action->post_content['email_to'];
                    break;
                }
            }
        }

        $values_table = $wpdb->prefix . 'frm_item_metata';
        $meta_table = $wpdb->prefix . 'frm_field_metatab';

        foreach ($rows as $row) {
            $data = array();
            $meta_rows = $wpdb->get_results($wpdb->prepare(
                "SELECT meta_key, meta_value FROM {$wpdb->prefix}frm_item_metata WHERE item_id = %d",
                $row['id']
            ), ARRAY_A);
            foreach ($meta_rows as $meta_row) {
                $data[$meta_row['meta_key']] = $meta_row['meta_value'];
            }

            $submissions[] = array(
                'id' => 'frm_' . $row['id'],
                'form_id' => $form_id,
                'plugin' => 'formidable',
                'status' => isset($row['status']) ? $row['status'] : 'sent',
                'submitted_at' => $row['created_at'] ?? null,
                'visitor_ip' => $row['user_ip'] ?? null,
                'submission_data' => $data,
                'destination_type' => 'email',
                'destination_address' => $dest_address,
            );
        }

        return $submissions;
    }

    private function get_custom_html_forms() {
        global $wpdb;
        $forms = array();

        $results = $wpdb->get_results(
            "SELECT ID, post_title, post_status, post_modified
             FROM {$wpdb->posts}
             WHERE post_type = 'shortcode'
             AND post_status IN ('publish', 'draft')",
            ARRAY_A
        );

        foreach ($results as $row) {
            $content = $wpdb->get_var($wpdb->prepare(
                "SELECT post_content FROM {$wpdb->posts} WHERE ID = %d",
                $row['ID']
            ));

            $has_form = false;
            if ($content) {
                $form_keywords = array('form', 'input', 'textarea', 'button', 'submit');
                $lower_content = strtolower($content);
                foreach ($form_keywords as $keyword) {
                    if (str_contains($lower_content, $keyword)) {
                        $has_form = true;
                        break;
                    }
                }
            }

            if (!$has_form) {
                continue;
            }

            $forms[] = array(
                'id' => (string) $row['ID'],
                'plugin' => 'custom-html',
                'name' => $row['post_title'],
                'description' => '',
                'status' => $row['post_status'] === 'publish' ? 'published' : 'draft',
                'shortcode' => '[custom-html-form id="' . $row['ID'] . '"]',
                'fields' => array(),
                'fields_count' => 0,
                'entries_count' => null,
                'health' => 'healthy',
                'responsive' => true,
                'auto_update_enabled' => false,
                'created_at' => '',
                'updated_at' => $row['post_modified'],
            );
        }

        return $forms;
    }
}
