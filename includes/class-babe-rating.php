<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

BABE_Rating::init();

/**
 * BABE_Rating Class.
 * Get general settings
 * @class 		BABE_Rating
 * @version		1.7.4
 * @author 		Booking Algorithms
 */

class BABE_Rating {
//////////////////////////////
    /**
	 * Hook in tabs.
	 */
    public static function init() {
        
        add_filter( 'comment_form_field_comment', array( __CLASS__, 'comment_form_field_comment'), 10 );
        add_action( 'edit_comment', array( __CLASS__, 'edit_comment'), 10, 2);
        add_action( 'comment_post', array( __CLASS__, 'new_comment_added'), 10, 3);
        add_action( 'transition_comment_status', array( __CLASS__, 'transition_comment_status'), 10, 3 );
        add_filter( 'comments_open', array(__CLASS__, 'comments_open'), 10, 2 );
        
        add_filter( 'get_comment_text', array( __CLASS__, 'get_comment_text'), 10, 3);
        
        add_filter( 'manage_'.BABE_Post_types::$booking_obj_post_type.'_posts_columns', array( __CLASS__, 'booking_obj_table_head'));
        add_action( 'manage_'.BABE_Post_types::$booking_obj_post_type.'_posts_custom_column', array( __CLASS__, 'booking_obj_table_content'), 10, 2 );

        add_filter( 'wp_comment_reply', array( __CLASS__, 'wp_comment_reply'), 10, 2);
        add_action( 'add_meta_boxes_comment', array( __CLASS__, 'add_meta_boxes_comment'), 10, 1);
	}

    public static function comments_open( bool $comments_open, int $post_id ): bool
    {
        global $wpdb;

        if (
            get_post_type($post_id) !== BABE_Post_types::$booking_obj_post_type
            || !BABE_Settings::$settings['reviews_allow_to_clients_only']
        ){
            return $comments_open;
        }

        $user = wp_get_current_user();

        if ( !$user instanceof WP_User || !$user->exists() || $user->ID === 0 ){
            return false;
        }

        $query = "SELECT * 
        FROM ".$wpdb->posts." posts
         
        INNER JOIN
        (
        SELECT CAST(meta_value AS UNSIGNED) AS customer_user, post_id AS pm_post_id 
        FROM ".$wpdb->postmeta."
        WHERE meta_key = '_customer_user'
        ) pm ON posts.ID = pm.pm_post_id AND pm.customer_user = ".$user->ID."
        
        INNER JOIN
        (
        SELECT CAST(meta_value AS UNSIGNED) AS booking_obj_id, post_id AS pm2_post_id 
        FROM ".$wpdb->postmeta."
        WHERE meta_key = '_booking_obj_id'
        ) pm2 ON posts.ID = pm2.pm2_post_id AND pm2.booking_obj_id = ".$post_id."
        
        INNER JOIN
        (
        SELECT meta_value AS status, post_id AS pm3_post_id 
        FROM ".$wpdb->postmeta."
        WHERE meta_key = '_status'
        ) pm3 ON posts.ID = pm3.pm3_post_id AND pm3.status IN ('payment_received','completed')
        
        WHERE posts.post_status = 'publish'
          AND posts.post_type = '".BABE_Post_types::$order_post_type."'
        
        ORDER BY posts.post_date DESC
        ";

        // run main query
        $orders = $wpdb->get_results($query, ARRAY_A);

        $comments = get_comments([
            'post_id' => $post_id,
            'author_email' => $user->user_email,
            'status' => 'approve',
        ]);

        return count($orders) > count($comments);
    }

    public static function add_meta_boxes_comment( WP_Comment $comment ): void
    {
        echo '<div class="meta-box-sortables ui-sortable">
<div id="postbox-rating" class="postbox">
<div class="postbox-header"><h2 class="hndle ui-sortable-handle">Rating Metadata</h2>
<div class="handle-actions"><button type="button" class="handlediv" aria-expanded="true"><span class="screen-reader-text">Toggle panel: Comment Metadata</span><span class="toggle-indicator" aria-hidden="true"></span></button></div></div>
<div class="inside">
<p class="comment-form-rating"><label>'.__('Rating:', 'ba-book-everything').'</label>
        '.self::comment_stars_rendering( $comment->comment_ID, true ).'
        </p>
        '.self::get_comment_rating_hidden_fields( $comment->comment_ID )
        .'
</div>
</div>
</div>
';
    }

    public static function wp_comment_reply( string $html, array $args ): string
    {
        global $post, $current_screen, $wp_list_table;

        if (
            !is_admin()
            || empty($current_screen)
            || $current_screen->base !== 'post'
            || $current_screen->post_type !== BABE_Post_types::$booking_obj_post_type
            || $post->post_type !== BABE_Post_types::$booking_obj_post_type
        ){
            return $html;
        }

        if ( ! $wp_list_table ) {
            if ( 'single' === $args['mode'] ) {
                $wp_list_table = _get_list_table( 'WP_Post_Comments_List_Table' );
            } else {
                $wp_list_table = _get_list_table( 'WP_Comments_List_Table' );
            }
        }

        $quicktags_settings = array( 'buttons' => 'strong,em,link,block,del,ins,img,ul,ol,li,code,close' );

        ob_start();
        wp_editor(
            '',
            'replycontent',
            array(
                'media_buttons' => false,
                'tinymce'       => false,
                'quicktags'     => $quicktags_settings,
            )
        );
        $wp_editor = ob_get_clean();

        ob_start();
        wp_admin_notice(
            '<p class="error"></p>',
            array(
                    'type' => 'error',
                    'additional_classes' => array( 'notice-alt', 'inline', 'hidden' ),
                    'paragraph_wrap'     => false,
            )
        );
        $wp_admin_notice = ob_get_clean();

        $wp_nonce_field = wp_nonce_field( 'replyto-comment', '_ajax_nonce-replyto-comment', false, false );

        if ( current_user_can( 'unfiltered_html' ) ) {
            $wp_nonce_field .= wp_nonce_field( 'unfiltered-html-comment', '_wp_unfiltered_html_comment', false, false );
        }

        $html = '
        <form method="get">
           <table style="display:none;"><tbody id="com-reply"><tr id="replyrow" class="inline-edit-row" style="display:none;"><td colspan="'.$wp_list_table->get_column_count().'" class="colspanchange">
              <fieldset class="comment-reply">
                                    <legend>
                                        <span class="hidden" id="editlegend">'.__( 'Edit Comment' ).'</span>
                                        <span class="hidden" id="replyhead">'.__( 'Reply to Comment' ).'</span>
                                        <span class="hidden" id="addhead">'.__( 'Add New Comment' ).'</span>
                                    </legend>

                                    <div id="replycontainer">
                                        <label for="replycontent" class="screen-reader-text">
                                            '.__( 'Comment' ).'
                                        </label>
                                        '.$wp_editor.'
                                    </div>
                                    
                                    <p class="comment-form-rating"><label>'.__('Rating:', 'ba-book-everything').'</label>
                                    '.self::comment_stars_rendering(0, true).'
                                    </p>
                                    '.self::get_comment_rating_hidden_fields().'

                                    <div id="edithead2">
                                        <div class="inside">
                                            <label for="author-name">'.__( 'Name' ).'</label>
                                            <input type="text" name="newcomment_author" size="50" value="" id="author-name" />
                                        </div>

                                        <div class="inside">
                                            <label for="author-email">'.__( 'Email' ).'</label>
                                            <input type="text" name="newcomment_author_email" size="50" value="" id="author-email" />
                                        </div>

                                        <div class="inside" style="display:none;">
                                            <label for="author-url">'.__( 'URL' ).'</label>
                                            <input type="text" id="author-url" name="newcomment_author_url" class="code" size="103" value="" />
                                        </div>
                                    </div>

                                    <div id="replysubmit" class="submit">
                                        <p class="reply-submit-buttons">
                                            <button type="button" class="save button button-primary">
                                                <span id="addbtn" style="display: none;">'.__( 'Add Comment' ).'</span>
                                                <span id="savebtn" style="display: none;">'.__( 'Update Comment' ).'</span>
                                                <span id="replybtn" style="display: none;">'.__( 'Submit Reply' ).'</span>
                                            </button>
                                            <button type="button" class="cancel button">'.__( 'Cancel' ).'</button>
                                            <span class="waiting spinner"></span>
                                        </p>
                                        '.$wp_admin_notice.'
                                    </div>

                                    <input type="hidden" name="action" id="action" value="" />
                                    <input type="hidden" name="comment_ID" id="comment_ID" value="" />
                                    <input type="hidden" name="comment_post_ID" id="comment_post_ID" value="" />
                                    <input type="hidden" name="status" id="status" value="" />
                                    <input type="hidden" name="position" id="position" value="'.$args['position'].'" />
                                    <input type="hidden" name="checkbox" id="checkbox" value="'.($args['checkbox'] ? 1 : 0).'" />
                                    <input type="hidden" name="mode" id="mode" value="'. esc_attr( $args['mode'] ).'" />
                                    '.$wp_nonce_field.'
                                </fieldset>                                
           </td></tr></tbody></table>
        </form>';

        return $html;
    }

    public static function delete_post_rating( $post_id ){

        $rating_criteria = BABE_Settings::get_rating_criteria();

        foreach ($rating_criteria as $rating_name => $rating_title){
            delete_post_meta( $post_id, '_rating_score_'.$rating_name );
            delete_post_meta( $post_id, '_rating_votes_'.$rating_name );
        }
        delete_post_meta( $post_id, '_rating');
    }

    /**
    * Fires when the comment status is in transition.
    * @param int|string $new_status The new comment status: unapproved, approved, spam, trash
    * @param int|string $old_status The old comment status.
    * @param WP_Comment     $comment    The comment data.
    */
    public static function transition_comment_status( $new_status, $old_status, $comment ){

        $post_id = $comment->comment_post_ID;

        $comments = get_comments([
            'status' => 1,
            'post_id' => $post_id,
        ]);

        if ( isset($comment_statuses[$new_status]) && $comment_statuses[$new_status] === 'approved' ){
            $comments[] = $comment;
        }

        self::recalculate_post_rating( $post_id, $comments );
    }

    public static function recalculate_post_rating( $post_id, $comments )
    {
        if ( empty($comments) ){
            self::delete_post_rating( $post_id );
            return;
        }

        $rating_criteria = BABE_Settings::get_rating_criteria();
        $stars_num = BABE_Settings::get_rating_stars_num();
        $sanitized_rating_arr = [];
        $rating_scores = [];
        $rating_votes = [];

        foreach( $comments as $approved_comment ){

            $rating_arr = self::get_comment_rating($approved_comment->comment_ID);

            foreach ($rating_criteria as $rating_name => $rating_title){

                if ( !isset($rating_arr[$rating_name]) ){
                    continue;
                }

                $rating = absint($rating_arr[$rating_name]);
                $rating = $rating > 0 && $rating <= $stars_num ? $rating : $stars_num;

                $rating_scores[$rating_name] = !empty($rating_scores[$rating_name])
                    ? $rating_scores[$rating_name] + $rating
                    : $rating;

                $rating_votes[$rating_name] = !empty($rating_votes[$rating_name])
                    ? $rating_votes[$rating_name] + 1
                    : 1;
            }
        }

        if ( empty($rating_scores) ){
            self::delete_post_rating( $post_id );
            return;
        }

        foreach( $rating_scores as $rating_name => $rating_score ){
            $sanitized_rating_arr[$rating_name] = $rating_scores[$rating_name]/$rating_votes[$rating_name];
            update_post_meta( $post_id, '_rating_score_'.$rating_name, $rating_scores[$rating_name] );
            update_post_meta( $post_id, '_rating_votes_'.$rating_name, $rating_votes[$rating_name] );
        }

        $rating_total = self::calculate_rating($sanitized_rating_arr);
        update_post_meta( $post_id, '_rating', $rating_total );
    }

    /**
     * Filters the text of a comment.
     * @see Walker_Comment::comment()
     *
     * @param string     $comment_content Text of the comment.
     * @param WP_Comment $comment         The comment object.
     * @param array      $args            An array of arguments.
     */
    public static function get_comment_text( $comment_content, $comment, $args ) {
        
        $comment_rating_arr = self::get_comment_rating($comment->comment_ID);
        
        if (!empty($comment_rating_arr)){
            $comment_content = self::comment_stars_rendering($comment->comment_ID, false).$comment_content;
        }
        
        return $comment_content;
    }

     /**
	 * Render comment stars
     * @param int $comment_id
     * @return string
	 */
     public static function comment_stars_rendering(
         int $comment_id = 0,
         bool $allow_to_edit = false
     ): string
     {
        $output = '';
        
        $comment_rating_arr = $comment_id ? self::get_comment_rating($comment_id) : array();
        $class_prefix = $comment_id && !$allow_to_edit ? 'comment' : 'comment-form';
        
        $rating_criteria = BABE_Settings::get_rating_criteria();
        $stars_num = BABE_Settings::get_rating_stars_num();
        $criteria_num = $comment_id ? count($comment_rating_arr) : count($rating_criteria);
        
        foreach ($rating_criteria as $rating_name => $rating_title){
           if (!$comment_id || ($comment_id && isset($comment_rating_arr[$rating_name]))){ 
            
            if ($criteria_num > 1){
                $output .= '<li><span class="'.$class_prefix.'-rating-criterion">'
                    .$rating_title
                    .'</span>';
            }
            
            $output .= '<span class="'.$class_prefix.'-rating-stars stars" data-rating-cr="'
                .$rating_name.'">';
            
            $rating = isset($comment_rating_arr[$rating_name])
                ? (float)$comment_rating_arr[$rating_name] : 0;

            for ($i = 1; $i<= $stars_num; $i++){
                $output .= self::star_rendering($i, $rating);
            }

            if ( $rating && $allow_to_edit ){
                $output .= '<span class="'.$class_prefix.'-total-rating-value">'.$rating.'</span>';
            }
            
            $output .= '</span>';
            
            if ($criteria_num > 1){
                $output .= '</li>';
            }
            
           } //// end if  !$comment_id
        } /// end foreach $rating_criteria
        
        if ($criteria_num > 1){
            $output = '<ul class="'.$class_prefix.'-rating-ul">'.$output.'</ul>';
        }
        
        if ( $comment_id && !$allow_to_edit ){
          //// get total rating stars  
            $total_rating = self::get_comment_total_rating($comment_id);
            if ($total_rating){
            
            $total_stars = '<span class="'.$class_prefix.'-total-rating-stars stars">';
            
            for ($i = 1; $i<= $stars_num; $i++){
                $total_stars .= self::star_rendering($i, $total_rating);
            }
            
            $total_stars .= '<span class="'.$class_prefix.'-total-rating-value">'
                .round($total_rating, 2).'</span>';
            
            $total_stars .= '</span>';
            
            $output =  $criteria_num > 1 ? $total_stars.$output : $total_stars;
            } else {
                $output = '';
            }
        }

        return $output;
     }

     /**
	 * Render star
     * @param int $star_num
     * @param float $rating
     * @return string
	 */
     public static function star_rendering( int $star_num, float $rating = 0): string
     {
         $ceil = ceil($rating);
         $floor = floor($rating);

         if ( $star_num <= $floor || ($star_num == $ceil && ($rating + 0.5) > $ceil) ){
             $star_img = '<i class="fas fa-star"></i>';
         } elseif ( $star_num == $ceil ){
             $star_img = '<i class="fas fa-star-half-alt"></i>';
         } else {
             $star_img = '<i class="far fa-star"></i>';
         }

         $output = '<span class="star star-'.$star_num.'" data-rating-val="'.$star_num.'">'.$star_img.'</span>';

         return apply_filters('babe_star_rendering', $output, $star_num, $rating, $star_img);
     }

     /**
	 * Render post stars
     * @param int $post_id
     * @return string
	 */
     public static function post_stars_rendering( int $post_id ): string
     {
        $output = '';
        
        $total_rating = self::get_post_total_rating($post_id);
        $total_votes = self::get_post_total_votes($post_id);

         if ( !$total_rating ){
             return $output;
         }

         $rating_arr = self::get_post_rating($post_id);

         $rating_criteria = BABE_Settings::get_rating_criteria();
         $stars_num = BABE_Settings::get_rating_stars_num();
         $criteria_num = count($rating_arr);

         foreach ($rating_criteria as $rating_name => $rating_title){
             if (isset($rating_arr[$rating_name])){

                 if ($criteria_num > 1){
                     $output .= '<li><span class="post-rating-criterion">'.$rating_title.'</span>';
                 }

                 $output .= '<span class="post-rating-stars stars" data-rating-cr="'.$rating_name.'">';

                 $rating = (float)$rating_arr[$rating_name];
                 for ($i = 1; $i<= $stars_num; $i++){
                     $output .= self::star_rendering($i, $rating);
                 }

                 $output .= '<span class="post-rating-value">'.round($rating, 2).'</span>';

                 $output .= '</span>';

                 if ($criteria_num > 1){
                     $output .= '</li>';
                 }

             } //// end if isset($rating_arr[$rating_name])
         } /// end foreach $rating_criteria

         if ($criteria_num > 1){
             $output = '<ul class="post-rating-ul">'.$output.'</ul>';
         }

         //// get total rating stars
         $total_stars = '<span class="post-total-rating-stars stars">';

         for ($i = 1; $i<= $stars_num; $i++){
             $total_stars .= self::star_rendering($i, $total_rating);
         }

         $by_reviews_text = $total_votes > 1 ? sprintf(__( 'by %d reviews', 'ba-book-everything' ), $total_votes) : '';

         $total_stars .= '<span class="post-total-rating-value">'.round($total_rating, 2).' '.$by_reviews_text.'</span>';

         $total_stars .= '</span>';

         $output =  $criteria_num > 1 ? $total_stars.$output : $total_stars;

         $output = '<div class="post-total-rating">
        '.$output.'
        </div>';

         return $output;
     }

    /**
     * Fires immediately after a comment is updated in the database.
     * The hook also fires immediately before comment status transition hooks are fired.
     * @param int   $comment_id The comment ID.
     * @param array $commentdata       Comment data.
     */
     public static function edit_comment( int $comment_id, array $commentdata): void
     {
         if ( !is_admin() || !isset($_POST['rating']) || !empty($commentdata['comment_parent']) ){
             return;
         }

         $sanitized_post_arr = self::sanitize_rating_post_data( (array)$_POST['rating'] );

         self::update_comment_rating($comment_id, $sanitized_post_arr);

         $comments = get_comments([
             'status' => 1,
             'post_id' => $commentdata['comment_post_ID'],
         ]);

         self::recalculate_post_rating( $commentdata['comment_post_ID'], $comments );
     }

     /**
     * Fires immediately after a comment is inserted into the database.
     * @param int        $comment_id       The comment ID.
     * @param int|string $comment_approved 1 if the comment is approved, 0 if not, 'spam' if spam.
     * @param array      $commentdata      Comment data.
     */
     public static function new_comment_added($comment_id, $comment_approved, $commentdata): void
     {
         if ( !isset($_POST['rating']) || !empty($commentdata['comment_parent']) ){
             return;
         }

         $sanitized_post_arr = self::sanitize_rating_post_data( (array)$_POST['rating'] );

         self::update_comment_rating($comment_id, $sanitized_post_arr);

         if ($comment_approved == 1){ ///the comment is approved

             $comments = get_comments([
                 'status' => 1,
                 'post_id' => $commentdata['comment_post_ID'],
             ]);

             self::recalculate_post_rating( $commentdata['comment_post_ID'], $comments );
         }

         if (
             is_admin()
             && wp_doing_ajax()
             && isset($_POST['_ajax_nonce-replyto-comment'], $_POST['action'])
             && $_POST['action'] === 'replyto-comment'
             && !empty($_POST['newcomment_author'])
             && !empty($_POST['newcomment_author_email'])
         ){
             $commentdata['comment_author'] = sanitize_text_field($_POST['newcomment_author']);
             $commentdata['comment_author_email'] = sanitize_email($_POST['newcomment_author_email']);
             $commentdata['user_id'] = 0;
             $commentdata['comment_ID'] = $comment_id;

             add_filter( 'pre_user_id', function ($user_id){
                 return 0;
             }, 100 );

             wp_update_comment($commentdata);
         }
     }

     /**
	 * Get comment rating total
     * @param string $field
     * @return string
	 */
     public static function comment_form_field_comment( string $field ): string
     {
        global $post;

        if (is_single() && $post->post_type == BABE_Post_types::$booking_obj_post_type){
            $field = '<p class="comment-form-rating"><label>'
                .apply_filters(
                    'babe_comment_form_field_comment_rating_title',
                    __('Rating:', 'ba-book-everything')
                )
                .'</label>
                '.self::comment_stars_rendering(0, false)
                .'</p>
              '.$field.'
              '.self::get_comment_rating_hidden_fields();
        }
        
        return $field;
     }

     /**
	 * Get comment rating hidden fields
     * @return string
	 */
     public static function get_comment_rating_hidden_fields( int $comment_id = 0 ): string
     {
        $output = '';
        
        $rating_criteria = BABE_Settings::get_rating_criteria();
        $comment_rating_arr = $comment_id ? self::get_comment_rating($comment_id) : array();
        
        foreach ($rating_criteria as $rating_name => $rating_title){
            $rating = isset($comment_rating_arr[$rating_name])
                ? (float)$comment_rating_arr[$rating_name] : 0;

            $output .= '
            <input type="hidden" id="rating_'.$rating_name.'" class="rating_hidden_input" name="rating['.$rating_name.']" value="'.$rating.'">
            ';
        }
        
        return $output;
     }

     /**
	 * Get comment rating total
     * @param int $comment_id
     * @return float
	 */
     public static function get_comment_rating_total( int $comment_id): float
     {
        return (float)get_comment_meta( $comment_id, '_rating', 1 );
     }

     /**
	 * Get comment rating for each criterion
     * @param int $comment_id
     * @return array
	 */
     public static function get_comment_rating( int $comment_id): array
     {
        $rating_arr = array();
        
        $rating_criteria = BABE_Settings::get_rating_criteria();
        
        foreach ($rating_criteria as $rating_name => $rating_title){
            
            $rating = get_comment_meta( $comment_id, '_rating_'.$rating_name, 1 );
            
            if ($rating){
              $rating_arr[$rating_name] = absint($rating);
            }  
        }
        
        return $rating_arr;
     }

     /**
	 * Get post rating for each criterion
     * @param int $post_id
     * @return array
	 */
     public static function get_post_rating( int $post_id): array
     {
        $rating_arr = array();
        
        $rating_criteria = BABE_Settings::get_rating_criteria();
        
        foreach ($rating_criteria as $rating_name => $rating_title){
                
                $current_rating_score = absint(get_post_meta($post_id, '_rating_score_'.$rating_name, true));
                $current_rating_votes = absint(get_post_meta($post_id, '_rating_votes_'.$rating_name, true));
                if ($current_rating_score && $current_rating_votes){
                  $current_rating = $current_rating_score/$current_rating_votes;
                  $rating_arr[$rating_name] = $current_rating;
                }
        }
        
        return $rating_arr;
     }

     /**
	 * Get post total rating
     * @param int $post_id
     * @return float
	 */
     public static function get_post_total_rating( int $post_id ): float
     {
        return (float)get_post_meta($post_id, '_rating', true);
     }

     /**
	 * Get post total votes
     * @param int $post_id
     * @return int
	 */
     public static function get_post_total_votes( int $post_id): int
     {
        $votes = 0;
        
        $rating_criteria = BABE_Settings::get_rating_criteria();
        
        foreach ($rating_criteria as $rating_name => $rating_title){
            $current_rating_votes = absint(get_post_meta($post_id, '_rating_votes_'.$rating_name, true));
            $votes = max($votes, $current_rating_votes);
        }
        
        return $votes;
     }

     /**
	 * Get comment total rating
     * @param int $comment_id
     * @return float
	 */
     public static function get_comment_total_rating( int $comment_id ): float
     {
        return (float)get_comment_meta($comment_id, '_rating', 1);
     }

     /**
	 * Calculate total rating
     * @param array $rating_arr - $criterion => $rating
     * @return float
	 */
     public static function calculate_rating( array $rating_arr ): float
     {
        $num = count($rating_arr);
        $num = $num ?: 1;
        $output = round(array_sum($rating_arr)/$num, 2);
        return apply_filters('babe_rating_calculate_total', $output, $rating_arr);
     }

     public static function sanitize_rating_post_data( array $post_arr ): array
     {
         $sanitized_post_arr = array();
         $stars_num = BABE_Settings::get_rating_stars_num();
         $rating_criteria = BABE_Settings::get_rating_criteria();
         foreach ($rating_criteria as $rating_name => $rating_title){
             if (isset($post_arr[$rating_name])){
                 $rating = absint($post_arr[$rating_name]);
                 $rating = $rating > 0 && $rating <= $stars_num ? $rating : $stars_num;
                 $sanitized_post_arr[$rating_name] = $rating;
             }
         }
         return $sanitized_post_arr;
     }

     /**
	 * Update comment rating
     * @param int $comment_id
     * @param array $rating_arr - $criterion => $rating
     * @return void
	 */
     public static function update_comment_rating( int $comment_id, array $rating_arr ): void
     {
        $rating_criteria = BABE_Settings::get_rating_criteria();
        $stars_num = BABE_Settings::get_rating_stars_num();
        $sanitized_rating_arr = array();
        
        foreach ($rating_criteria as $rating_name => $rating_title){     
            if (isset($rating_arr[$rating_name])){
                $rating = absint($rating_arr[$rating_name]);
                $rating = $rating > 0 && $rating <= $stars_num ? $rating : $stars_num;
                update_comment_meta( $comment_id, '_rating_'.$rating_name, $rating );
                $sanitized_rating_arr[$rating_name] = $rating;
            }   
        }
        
        $rating_total = self::calculate_rating($sanitized_rating_arr);
        update_comment_meta( $comment_id, '_rating', $rating_total );
     }

     /**
	 * Update post rating
     * @param int $post_id
     * @param array $rating_arr - $criterion => $rating
     * @param string $flag - add/remove comment rating to/from post rating
     * @return void
	 */
     public static function update_post_rating(
         int $post_id,
         array $rating_arr,
         string $flag = 'add'
     ): void
     {
         if ( empty($rating_arr) ){
             return;
         }

         $rating_criteria = BABE_Settings::get_rating_criteria();
         $stars_num = BABE_Settings::get_rating_stars_num();
         $sanitized_rating_arr = array();

         foreach ($rating_criteria as $rating_name => $rating_title){
             if (isset($rating_arr[$rating_name])){
                 $rating = absint($rating_arr[$rating_name]);
                 $rating = $rating > 0 && $rating <= $stars_num ? $rating : $stars_num;
                 $current_rating_score = absint(get_post_meta($post_id, '_rating_score_'.$rating_name, true));
                 $current_rating_votes = absint(get_post_meta($post_id, '_rating_votes_'.$rating_name, true));

                 if ($flag === 'add'){
                     $current_rating_score += $rating;
                     $current_rating_votes += 1;
                 } else {
                     $current_rating_score -= $rating;
                     $current_rating_votes -= 1;
                 }

                 $current_rating = $current_rating_score/$current_rating_votes;

                 update_post_meta( $post_id, '_rating_score_'.$rating_name, $current_rating_score );
                 update_post_meta( $post_id, '_rating_votes_'.$rating_name, $current_rating_votes );

                 $sanitized_rating_arr[$rating_name] = $current_rating;
             }
         }

         $rating_total = self::calculate_rating($sanitized_rating_arr);
         update_post_meta( $post_id, '_rating', $rating_total );
     }

    /**
	 * Add booking obj custom column heads.
     * @param array $defaults
     * @return array
	 */
    public static function booking_obj_table_head( array $defaults ): array
    {
        $defaults['rating']   = __('Rating', 'ba-book-everything');
        return $defaults;
    }

    /**
	 * Add booking obj custom column content.
     * @param string $column_name
     * @param int $post_id
     * @return void
	 */
    public static function booking_obj_table_content( string $column_name, int $post_id ): void
    {
        if ($column_name === 'rating') {
            echo self::post_stars_rendering($post_id);
        }
    }
        
////////////////////    
}