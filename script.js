var menuToggle = false;
$(document).ready(function(){
  $('.menu-btn').click(function(){
    $('.navbar .menu').toggleClass('active');
    $('.navbar .menu-btn').toggleClass('active');
    menuToggle = true;
  });
  $('.navbar .menu li a').click(function(){
    if(menuToggle){
      $('.navbar .menu').toggleClass('active');
      $('.navbar .menu-btn').toggleClass('active');
      menuToggle = false
    }
  });
});
