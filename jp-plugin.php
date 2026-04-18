<?php
/*
Plugin Name: JP Site Helper
Description: Helper functions for Japanese WordPress site
Version: 1.0
Author: Mustafa
*/

function jp_site_helper_init() {
    echo "Japanese Site Helper Activated!";
}
add_action('init', 'jp_site_helper_init');
?>
// Add Japanese date function
function jp_display_date() {
    date_default_timezone_set('Asia/Tokyo');
    return date('Y?m?d? (l)');
}

// Add Japanese text helper
function jp_text_safe() {
    return mb_convert_encoding(, 'UTF-8', 'auto');
}

// Add admin menu
function jp_admin_menu() {
    add_menu_page(
        'JP Site Helper',
        'JP Helper',
        'manage_options',
        'jp-site-helper',
        'jp_admin_page'
    );
}
add_action('admin_menu', 'jp_admin_menu');

function jp_admin_page() {
    echo '<div class="wrap">';
    echo '<h1>Japanese Site Helper</h1>';
    echo '<p>Today is: ' . jp_display_date() . '</p>';
    echo '</div>';
}
