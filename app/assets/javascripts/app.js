function getState(data) {
  return {
    url: window.location.pathname,
    data: $.microdata.json(data.items())
  }
}

$(document).ready(function() {
  var dataContainer = $('#data');
  var state = getState(dataContainer);
  console.log(state);

  $(document).pjax('a', dataContainer);

  $(document).on('submit', 'form', function(event) {
    $.pjax.submit(event, dataContainer);
  })

  $(document).on('pjax:complete', function() {
    state = getState(dataContainer);
    console.log(state);
  })
});