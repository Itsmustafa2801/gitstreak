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