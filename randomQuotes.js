// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: magic;
// variables declaration
var today = new Date()
var fm = FileManager.local()
var lastUpdatePath = fm.documentsDirectory() + '/lastUpdate.txt'
var jsonPath = fm.documentsDirectory() + '/quotes.json'
var apiKeyPath = fm.documentsDirectory() + 'apiKey.txt'
var isUpdated = true
var purpose = 'misc'

/// API key
if (config.runsInApp) {
  var alert = new Alert()
  alert.title = 'Would you like to reset API key?'
  alert.addAction('Yes')
  alert.addAction('No')
  var r = await alert.present()
  if (r == 0) {
    purpose = 'updateAPI'
  }
}

// config variables
if (args.widgetParameter == 'light') {
  var fontColor = '232323'
  var bgColor = 'efefef'
} else if (args.widgetParameter == 'dark') {
  var fontColor = 'efefef'
  var bgColor = '232323'
} else {
  var fontColor = '232323'
  var bgColor = 'efefef'
}
if (config.runsInAccessoryWidget) {
  var maxLength = 70
  var size = 12
  var name = false
} else {
  var maxLength = 100
  var size = 18
  var name = true
}

// enter API key
if ((!fm.fileExists(apiKeyPath)) || purpose == 'updateAPI') {
  var alert = new Alert()
  alert.title = 'Enter API key'
  alert.addTextField('API key')
  alert.addAction('OK')
  alert.addCancelAction('Cancel')
  var r = await alert.present()
  if (r != -1) { // when api key entered
    if (alert.textFieldValue(0).length == 32) {  // valid api key
      fm.writeString(apiKeyPath, alert.textFieldValue(0))
      var key = alert.textFieldValue(0)
      alert = new Alert()
      alert.title = 'API key loaded successfully'
      alert.addCancelAction('ok')
      await alert.present()
    } else {
      alert = new Alert()
      alert.title = 'Invalid API key\n try again or get API key by yourself'
      alert.addCancelAction('ok')
      var key = 'invalidKey'
      await alert.present()
    }
  }
} else {
  var key = fm.readString(apiKeyPath)
}

// decide whether to load from local
if (!fm.fileExists(lastUpdatePath)) {  // check whether this widget has run before
  isUpdated = false
} else {  // widget has not updated today
  isUpdated = fm.readString(lastUpdatePath) == today.getDate()
}

try {
  var json = await getQuotes()
  chooseQuote()
} catch (e) {
  if (e.message = 'Invalid Access Token') {
    info = {
      'body' : 'invalid access token (API key)',
      'author' : 'run this script from app'
    }
  } else {
    isUpdated = true
    var json = await getQuotes()  // load from local
    chooseQuote()
  }
}

async function getQuotes() {
  if (isUpdated == false) { // when it is not updated or hasn't run before
    var rq = new Request("https://favqs.com/api/quotes")
    rq.headers = {
      "Authorization": "Token token=" + key
    }
    rq = await rq.loadString()  // use loadString as string data is required later
    if (rq == `HTTP Token: Access denied.
`) {
      throw new Error('Invalid Access Token')
    }
    var json = JSON.parse(rq)
    fm.writeString(lastUpdatePath, String(today.getDate()))
    fm.writeString(jsonPath, rq)
  } else {
    var json = JSON.parse(fm.readString(jsonPath))  // read from cache
  }
  return json.quotes
}

// choose which quote to show (length-based judgement)

function chooseQuote() {
  info = ""
  while (info == "" || info.body.length >= maxLength || info.body.length <= 20) {
    info = json[Math.floor(Math.random() * (json.length - 1))]
  }
}

// construct widget
function createWidget() {
}
var widget = new ListWidget()
var quote = widget.addText(info.body)
quote.font = new Font("Futura-MediumItalic", size)
quote.minimumScaleFactor = 0

if (name) {
  var author = widget.addText(info.author)
  author.font = new Font("Futura-Medium", size - 7)
  author.rightAlignText()
  author.textColor = new Color(fontColor)
}
if (!config.runsInAccessoryWidget) {
  quote.textColor = new Color(fontColor)
  widget.backgroundColor = new Color(bgColor)
}

Script.setWidget(widget)
widget.presentMedium()
