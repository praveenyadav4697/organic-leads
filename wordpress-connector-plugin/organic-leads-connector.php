<?php
/**
 * Plugin Name: Organic Leads Connector
 * Plugin URI: https://organic-leads.com
 * Description: Provides authenticated REST API endpoints for Organic Leads to sync WordPress system data, plugins, themes, and health metrics.
 * Version: 1.0.0
 * Author: Organic Leads
 * Author URI: https://organic-leads.com
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: organic-leads-connector
 * Domain Path: /languages
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ORGANIC_LEADS_CONNECTOR_VERSION', '1.0.0');
define('ORGANIC_LEADS_CONNECTOR_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ORGANIC_LEADS_CONNECTOR_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once ORGANIC_LEADS_CONNECTOR_PLUGIN_DIR . 'includes/class-rest-api.php';
require_once ORGANIC_LEADS_CONNECTOR_PLUGIN_DIR . 'includes/class-sync.php';
require_once ORGANIC_LEADS_CONNECTOR_PLUGIN_DIR . 'includes/modules/class-forms.php';
require_once ORGANIC_LEADS_CONNECTOR_PLUGIN_DIR . 'includes/modules/class-tracking.php';

class Organic_Leads_Connector {
    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('plugins_loaded', array($this, 'load_textdomain'));
    }

    public function register_rest_routes() {
        $rest_api = new Organic_Leads_REST_API();
        $rest_api->register_routes();
    }

    public function load_textdomain() {
        load_plugin_textdomain('organic-leads-connector', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
}

function organic_leads_connector_init() {
    return Organic_Leads_Connector::get_instance();
}

add_action('init', 'organic_leads_connector_init');
