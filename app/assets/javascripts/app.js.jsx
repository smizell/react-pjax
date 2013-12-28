/** @jsx React.DOM */

function getData(data) {
  return {
    url: window.location.pathname,
    data: JSON.parse($.microdata.json(data.items())),
    resourceName: $('meta[name="resource_name"]').attr('value')
  }
}

var App = React.createClass({
  // This is our initial state of the app. This will read the data
  // that is sent in the response. From here on, we will read the
  // state of the app from events.
  getInitialState: function() {
    return {data: getData(this.props.dataContainer)};
  },
  componentDidMount: function() {
    var _this = this;
    // We don't want the page moving around when things are clicked
    $.pjax.defaults.scrollTo = false;
    
    // Any link that does not have # will get pjaxed
    $(document).pjax('a[href!="#"]', _this.props.dataContainer);
    
    // All forms in our data get pjaxed
    $(document).on('submit', '#data form', function(event) {
      $.pjax.submit(event, _this.props.dataContainer);
    })
  
    // When pjax is complete, set the state to the new data
    $(document).on('pjax:complete', function() {
      _this.setState({data: getData(_this.props.dataContainer)});
      console.log(_this.state);
    })
    
    // This will set the state on back and forward in the browser
    // You could maintain a history of the page state and allow the
    // users to go back and forth through the history of the state,
    // though this is much different than how we use the web today
    // where POST requests are non-idempotent.
    window.addEventListener("popstate", function(e) {
      _this.setState({data: getData(_this.props.dataContainer)});
      console.log(_this.state);
    });
  },
  // This is kind of like a router, except it routes based
  // on the resource name rather than the URL. This separates
  // our app even more from being tied to URLs.
  // This could be done a LOT better.
  render: function() {
    switch(this.state.data.resourceName) {
      case "Blog":
        return (<Blog data={this.state.data.data} />);
        break;
      case "BlogPosting":
        return (<BlogPosting data={this.state.data.data}/>);
        break;
    }
  }
});

var Blog = React.createClass({
  getInitialState: function() {
    return ({editing: false});
  },
  // No need to have any URLs or methods known here by the app
  // code. Simply fill out the form that was returned in the response
  // and submit it. If there are errors, you would handle them from
  // the response.
  handleSubmit: function() {
    var form = $('#data').find('.new_post');
    form.find('#post_title').val(this.refs.headline.getDOMNode().value);
    form.find('#post_body').val(this.refs.text.getDOMNode().value);
    form.submit();
    return false;
  },
  handleNewClick: function(e) {
    // Toggles new clicks
    this.setState({editing: !this.state.editing});
    e.preventDefault();
  },
  render: function() {
    blogNodes = this.props.data.items.map(function(blogPosting) {
      var blogHeadline = {
        headline: blogPosting.properties.headline[0],
        url: blogPosting.properties.url[0]
      }
      return (<BlogHeadline blogHeadline={blogHeadline} />);
    });
    return (
      <div className={React.addons.classSet({editing: this.state.editing})}>
        <div class="blog-postings">
          <p><a href="#" onClick={this.handleNewClick}>New Post</a></p>
          {blogNodes}
        </div>
        <div className="blog-posting-new">
          <form onSubmit={this.handleSubmit}>
            <p><label>Title</label><br />
            <input type="text" ref="headline" /></p>
            <p><label>Body</label><br />
            <textarea ref="text" /></p>
            <input type="submit" value="Save" />
          </form>
        </div>
      </div>); 
  }
});
      
var BlogHeadline = React.createClass({
  render: function() {
    var blogHeadline = this.props.blogHeadline;
    return(
      <article>
        <h1><a href={blogHeadline.url}>{blogHeadline.headline}</a></h1>
      </article>
    );
  }
});
    
var BlogPosting = React.createClass({
  getInitialState: function() {
    var _this = this;
    return ({
      editing: false,
      blogPosting: _this.getBlogPosting()
    });
  },
  // This is a little different that how submits are handled
  // when the post is new. In this instant, we want to change
  // the state of the page first thing to make it appear quick.
  // After we change the state, we then submit the form.
  // If you were handling errors, you'd want to probably
  // deal with this differently.
  handleSubmit: function() {
    var _this = this;
    this.setState({
      editing: false,
      blogPosting: {
        headline: _this.refs.headline.getDOMNode().value,
        rawBody: _this.refs.text.getDOMNode().value,
        body: _this.convert(_this.refs.text.getDOMNode().value)
      }
    });
    
    // Submit the form
    var form = $('#data').find('.edit_post');
    form.find('#post_title').val(this.refs.headline.getDOMNode().value);
    form.find('#post_body').val(this.refs.text.getDOMNode().value);
    form.submit();
    return false;
  },
  handleEditClick: function() {
    this.state.editing = !this.state.editing;
    this.setState(this.state);
    return false;
  },
  // No URL here and no handling of application state. We just follow
  // the URLs, and since it is pjax, the page doesn't get reloaded.
  handleBackClick: function() {
    $('#data').find('a.back').click(); 
  },
  render: function() {
    var blogPosting = this.state.blogPosting;
    return (
      <div className={React.addons.classSet({editing: this.state.editing})}>
        <div className="blog-posting">
          <h1>{blogPosting.headline}</h1>
          <p><a href="#" onClick={this.handleEditClick}>Edit</a></p>
          <div dangerouslySetInnerHTML={{__html: blogPosting.body}} />
          <p><a href="#back" onClick={this.handleBackClick}>Back to postings list</a></p>
        </div>
        <div className="blog-posting-edit">
          <form onSubmit={this.handleSubmit}>
            <p><label>Title</label><br />
            <input type="text" ref="headline" value={blogPosting.headline} /></p>
            <p><label>Body</label><br />
            <textarea ref="text" defaultValue={blogPosting.rawBody} /></p>
            <input type="submit" value="Save" />
          </form>
        </div>
      </div>
    ); 
  },
  getBlogPosting: function() {
    var blogPosting = this.props.data.items[0].properties;
    return {
      headline: blogPosting.headline[0],
      rawBody: blogPosting.text[0],
      body: this.convert(blogPosting.text[0])
    }
  },
  convert: function(text) {
    var converter = new Showdown.converter();
    return converter.makeHtml(text);
  }
});

$(document).ready(function() {
  var dataContainer = $('#data');
  var appContainerID = 'app';

  // This is ugly, but it's just quick and dirty. Basically it changes
  // up the layout so I have no UI-related HTML in my responses and to
  // allow me to have boxes around the different HTML areas. In a real
  // situation, this would not be necessary.
  $('body').prepend('<div id="app"></div>');
  $('#data').wrap('<div class="grid-40 data-container"></div>');
  $('#app').wrap('<div class="grid-60"></div>');
  $('#data').before('<h1 class="title title-data">HTML Representation</h1>');
  $('#app').before('<h1 class="title title-app">HTML UI</h1>');
  
  // Toggle button for showing/hiding the HTML representation
  $('body').prepend('<div class="nav"><a href="#" class="toggle-html">Toggle HTML Representation</a></div>');
  $('.toggle-html').click(function(e) {
    $('.data-container').toggle();
    e.preventDefault();
  });
  
  // Finally, render the app
  React.renderComponent(
    <App dataContainer={dataContainer} />,
    document.getElementById(appContainerID)
  );
});