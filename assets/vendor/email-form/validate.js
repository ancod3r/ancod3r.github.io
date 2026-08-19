// Validate Contact Form
$('form.email-form').submit(function(e) {
    e.preventDefault();
    var this_form = $(this);
    var action = this_form.attr('action');
    var submitButton = this_form.find('button[type="submit"]');
    var name = this_form.find('[name="name"]').val().trim();
    var email = this_form.find('[name="email"]').val().trim();
    var subject = this_form.find('[name="subject"]').val().trim();
    var message = this_form.find('[name="message"]').val().trim();
/* VALIDATE EMPTY FIELDS */
    if (!name || !email || !subject || !message) {
        this_form.find('.sent-message').hide();
        this_form.find('.error-message').show().html('Please fill in all fields.');
        return false;
    }
/* VALIDATE EMAIL */
    var emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(email)) {
        this_form
            .find('.error-message')
            .show()
            .html('Please enter a valid e-mail address.');
        return false;
    }
/* VALIDATE FORM ACTION GET ENDPOINT */
    if (!action) {
        this_form.find('.loading').hide();
        this_form.find('.error-message').show()
            .html('The form action property is not set!');
        return false;
    }
/* VALIDATE TURNSTILE */
    var turnstileResponse = this_form.find('[name="cf-turnstile-response"]').val();
    if (!turnstileResponse) {
        this_form.find('.error-message').show().html('Please complete the security verification.');
        return false;
    }
/* RESET STATUS MESSAGES */
    this_form.find('.sent-message').hide();
    this_form.find('.error-message').hide();
    this_form.find('.loading').show();
/* PREVENT MULTIPLE SUBMISSIONS */
    submitButton
        .prop('disabled',true)
        .text('Sending...');
/* SUBMIT TO FORMSPREE */
    $.ajax({
        url: action,
        method: 'POST',
        dataType: 'json',
        data: this_form.serialize(),
/* SUCCESS */
        success: function(response) {
            this_form.find('.loading').hide();
            this_form.find('.error-message').hide();
            this_form.find('.sent-message').show().html('Your message has been sent. Thank you!');
            this_form[0].reset();
/* Button stays disabled until a new Turnstile token is generated. */
            submitButton
                .prop('disabled',true)
                .text('Message Sent');
        },
/* ERROR */
        error: function(xhr) {
            this_form.find('.loading').hide();
            var errorMessage =
                'Unable to send your message. Please try again later.';
            if (xhr.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            } else if (xhr.responseJSON && xhr.responseJSON.errors) {
                errorMessage = xhr.responseJSON.errors
                    .map(function(error) {
                        return error.message;
                    })
                    .join('<br>');
            } else if (xhr.responseJSON && xhr.responseJSON.error) {
                errorMessage = xhr.responseJSON.error;
            }
            /* SHOW ERROR */
            this_form.find('.error-message')
                .show()
                .html(errorMessage);
/* Turnstile tokens are one-time tokens. Always reset after failed submission. */
            if (typeof turnstile !== 'undefined' &&
                typeof turnstileWidgetId !== 'undefined' &&
                turnstileWidgetId !== null
            ) {turnstile.reset(turnstileWidgetId);
            }
/* Button becomes enabled again after Turnstile generates a new token. */
            submitButton
                .prop('disabled',false)
                .text('Send Message');
        }
    });
    return false;
});