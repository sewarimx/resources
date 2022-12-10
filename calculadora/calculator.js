(function($, window, document, undefined) {
    // Global Constants
    const $DOM = {
        win:     $(window),
        doc:     $(document),
        htmlTag: $('html,body'),
        bodyTag: $('body')
    }

    $( document ).ready(function() {
        $(this).Calculator();
    });



    $.fn.Calculator = function () {
        const $container = $('#calculator'),
            $wrapper = $('.calc-wr')
            $submit = $('#calc-sb'),
            $reset = $('#calc-rs'),
            $slider = $container.find('#weight-slider'),
            fields = {
                weight :            [
                    $container.find('input[name=weight]'), //hidden input
                    $container.find('#weight-sl--vl'), //visible span
                ],
                weight_unit :       $container.find('input[name=unit]'),
                strength :          $container.find('input[name=strength]'),
                totalcbd :           $container.find('input[name=totalcbd]'),
                volume :            $container.find('select[name=volume]')
            }

        if(!$container.length && !$submit.length) {
            return false;
        }


        InitSlider();
        InputValidation(fields.totalcbd);
        $submit.on('click', function (e) { e.preventDefault(); ValidateForm(); })
        $reset.on('click', function (e) { ResetForm(); });
        EmbedPopup($DOM, $wrapper);



        function InitSlider () {

            if (!$slider.length) {
                return false;
            }
            var $toggle_checked = $container.find('input[name=unit]:checked'),
                attributes = {
                    range:           $slider.data('range'),
                    min:             $slider.data('min'),
                    max:             $slider.data('max'),
                    step:            $slider.data('step'),
                    value:           50,
                    type:            $toggle_checked.val()
                };

            /*Set initial value for input field*/
            fields.weight[0].attr('value', attributes.value);

            /*Get input value*/
            fields.weight[0].on('keyup', function (event) {
                var $this = $(this);
                attributes.value = parseInt($this.val(), 10);
                var _min = parseInt($this.attr('min'), 10);

                if (attributes.value >= _min) {
                    fields.weight[1].text(attributes.value);
                    $slider.slider('value', attributes.value);
                }
            });

            /*Slider init*/
            $slider.slider({
                range:              attributes.range,
                min:                attributes.min,
                max:                attributes.max,
                step:               attributes.step,
                value:              attributes.value,
                create:             function (event, ui) {
                    fields.weight[1].text(attributes.value);
                },
                slide:              function (event, ui) {
                    attributes.value = ui.value;
                    fields.weight[1].text(ui.value);
                    fields.weight[0].val(ui.value);
                    $slider.find('.val-tooltip .val').html(ui.value);
                }
            });


            var $handler = $slider.find('.ui-slider-handle');
            $handler.append("<div class='val-tooltip'><span class='val'>"+$slider.slider('value')+"</span><span class='arrow'></span></div>");

            /*Convert to selected unit*/
            fields.weight_unit.on('change', function () {
                if ($(this).is(':checked')) {
                    var unit = $(this).val();
                    attributes.type = unit;
                    if (unit == 'lb') {
                        attributes.value = (attributes.value * 2.205).toFixed();
                        attributes.max = (attributes.max * 2.205).toFixed();
                    }
                    if (unit == 'kg') {
                        attributes.value = (attributes.value / 2.205).toFixed();
                        attributes.max = (attributes.max / 2.205).toFixed();
                    }
                    fields.weight[0].val(attributes.value);
                    fields.weight[1].text(attributes.value);
                    $slider.slider({'value': attributes.value, 'max': attributes.max});
                }
            });
            /*Allow to input only numbers */
            InputValidation(fields.weight[0]);
        }

        function ValidateForm () {
            var results = getResults();

            var error = '<div class="calc-error">*This field is required</div>';
            var message = '<div class="calc-message">*Please fill in this field</div>';

            var calculate = false;

            if (results.weight[0] == 0) {
                calculate = false;
                fields.weight[0].parent().siblings('.calc-error').length == 0 ? $(error).insertBefore(fields.weight[0].parent().siblings('.calc--lb')).hide().slideDown(300) : "";
            }
            else {
                calculate = true;
                fields.weight[0].parent().siblings('.calc-error').length != 0 ? fields.weight[0].parent().siblings('.calc-error').remove() : "";
            }

            if (results.strength == 0) {
                calculate = false;
                fields.strength.parent().siblings('.calc-error').length == 0 ? $(error).insertBefore(fields.strength.parent().siblings('.calc--lb')).hide().slideDown(300) : "";
            }
            else {
                calculate = true;
                fields.strength.parent().siblings('.calc-error').length != 0 ? fields.strength.parent().siblings('.calc-error').remove() : "";
            }

            // if (results.totalcbd == 0 && results.volume != 0) {
            //     calculate = false;
            //     fields.totalcbd.parent().siblings('.calc-message').length == 0 ? $(message).insertBefore(fields.totalcbd.parent().siblings('.calc--lb')).hide().slideDown(300) : "";
            // }
            // else {
            //     fields.totalcbd.parent().siblings('.calc-message').length != 0 ? fields.totalcbd.parent().siblings('.calc-message').remove() : "";
            // }
            //
            // if (results.volume == 0 && results.totalcbd != 0) {
            //     calculate = false;
            //     fields.volume.parent().siblings('.calc-message').length == 0 ? $(message).insertBefore(fields.volume.parent().siblings('.calc--lb')).hide().slideDown(300) : "";
            // }
            // else {
            //     fields.volume.parent().siblings('.calc-message').length != 0 ? fields.volume.parent().siblings('.calc-message').remove() : "";
            // }

            calculate ? CalculateResults(results) : "";
        }

        function ResetForm ($res_reset=false) {

            fields.weight[0].val(50);
            fields.weight[1].text(fields.weight[0].val());
            $slider.slider('value', fields.weight[0].val());

            $container.children().show();


            if ($container.find('.calc-results').length > 0) {
                $container.find('.calc-results').remove();
                $container.css('height', 'auto');
                $container.children().fadeIn(300);
                $('.calc-actions').fadeIn(300);
            }

            if ($res_reset) $reset.trigger('click');

            $container.find('.calc-error').slideUp(300, function() { $(this).remove(); });
            $container.find('.calc-message').slideUp(300, function() { $(this).remove(); });
        }

        function getResults () {

            var weight_unit = fields.weight_unit.filter(":checked").val() == "kg" ? 1 : fields.weight_unit.filter(":checked").val() == "lb" ? 2.205 : 0;
            return {
                weight :            fields.weight[0].val() ? parseInt((fields.weight[0].val()/weight_unit).toFixed()) : 0,
                strength :          fields.strength.filter(":checked").val() == "mild" ? 0.22 : fields.strength.filter(":checked").val() == "moderate" ? 0.66 : fields.strength.filter(":checked").val() == "heavy" ? 1.33 : 0,
                totalcbd :          fields.totalcbd.val() ? parseInt(fields.totalcbd.val()) : 0,
                volume :            $(fields.volume)[0].selectedIndex == 1 ? 15 : $(fields.volume)[0].selectedIndex == 2 ? 30 : $(fields.volume)[0].selectedIndex == 3 ? 50 : $(fields.volume)[0].selectedIndex == 4 ? 60 : $(fields.volume)[0].selectedIndex == 5 ? 120 : 0,
            };
        }

        function CalculateResults (results) {

            var $dosecbd = parseFloat(results.weight * results.strength),
                $html_dosecbd = $dosecbd,
                $decimal = $dosecbd % 1;

            var $results_reset = $('#calc-results-rs');

            var $output = '<div class="calc-results">';
            $output += '<p class="calc-results--title">Tu dosis personalizada de CBD</p>';

            if ( $decimal != 0 && $decimal != .5) {
                $html_dosecbd = Math.round($dosecbd);
            }

            $output += '<div class="calc--r calc--r-dosecbd">' +
                '<div class="calc--lb"><div class="lb-tt"><span class="lb-icon lb-icon-volume"></span>Dosis recomendada de CBD</div>' +
                '<span class="calc-results--exp">Este resultado muestra la dosis recomendada de CBD en miligramos (mg) </span>' +
                '</div>' +
                '<div class="calc-results--wr">'+$html_dosecbd+'mg' +
                '</div>' +
                '</div>';

            $output += '<div class="calc--r calc--r-doseoil">' +
                '<div class="calc--lb"><div class="lb-tt"><span class="lb-icon lb-icon-totalcbd"></span>¿Cuántas gotas necesito?</div>' +
                '<span class="calc-results--exp">Este resultado muestra la dosis recomendada en cantidad de aceite (mL).</span>';


            if (results.totalcbd != 0 && results.volume != 0) {
                if (!(isNaN($dosecbd)) && $dosecbd > 0)
                    var $doseoil = Math.round(($dosecbd / (results.totalcbd / results.volume)) * 10) / 10;


                $output += '<span class="calc-results--exp-g">20 gotas = 1 mL.</span></div>' +
                    '<div class="calc-results--wr">'+$doseoil+'mL</div></div>';
            }
            else $output += '<span class="calc-results--req">*Para obtener este valor tienes que llenar los campos de potencia y volumen.</span></div></div>';

            $output += '<div class="b-reset">' +
                '                <span class="reset-icon"></span><input type="reset" id="calc-results-rs" name="reset" value="Calcular nuevamente">' +
                '            </div>';
            $output += '</div>';

            // $container.hide();
            // $($output).insertBefore($container).hide().fadeIn(150);

            var $height = $container.outerHeight();
            $container.children().hide();
            $('.calc-actions').hide();

            $container.css('height', $height).append($output).hide().fadeIn(150);
            var $res_reset = $container.find('#calc-results-rs');
            $res_reset.on('click', function (e) { ResetForm(true); })
        }
    }

    function InputValidation ($input) {
        $input.keypress(function(e) {
            return (e.charCode !=8 && e.charCode ==0 || (e.charCode >= 48 && e.charCode <= 57))
        });
    }

    function EmbedPopup ($DOM, $wrapper) {
        var $button = $wrapper.find('.embed-btn'),
            $overlay = $wrapper.find('.cta-overlay'),
            $close = $wrapper.find('.close-btn'),
            $tooltip = $wrapper.find('.cta-tooltip'),
            $modal = $wrapper.find('.cta-modal'),
            $content_embed = $wrapper.find('textarea#embed');


        $button.on('click', function () {
            $overlay.addClass("is-open");
            return false;
        });
        $close.on('click', function () {
            $overlay.removeClass("is-open");
        });

        $("button.copytoken").on('click', function (e) {
            $content_embed.select();
            document.execCommand("copy");

            $tooltip.fadeIn();

            $modal.css("padding-bottom","11rem");

            window.setTimeout( function(){
                $tooltip.fadeOut();
                if ($DOM.win.width()<=500) {
                    $modal.css("padding-bottom","1rem");
                } else $modal.css("padding-bottom","2rem");
            }, 5000 );
        });

        // //On clicking the modal background
        // $overlay.bind("click", function () {
        //     $overlay.removeClass("is-open");
        // });
    }

})(jQuery, window, document);