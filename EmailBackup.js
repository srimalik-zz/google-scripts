function sleep(time)
{
  var curr = new Date().getTime();
  while(true) {
    now = new Date().getTime();;
    if ((now - curr) > time) {
      Logger.log("breaking" + now - curr);
      break;
    } else {
      Logger.log("not breaking" + now - curr);
    }
  }
}

function myFunction() {
  var rootFolder = "GmailBackup";
  var label = "<replace with your gmail label>";
  var labelFile = "replace with filename prefix"
  var currentTime = new Date().getTime();
  var fileName = labelFile + "_" + currentTime;
  
  /*  
  //TODO: error out if more than one file found.
  */
  
  var gmailBackupFolder;
  var folders = DriveApp.searchFolders('title contains "' + rootFolder + '"')
  if (folders.hasNext()) {
    gmailBackupFolder = folders.next();
  } else {
    gmailBackupFolder = DriveApp.createFolder(rootFolder);
  }
  
  var fromLabelBackupFolder;
  folders = gmailBackupFolder.searchFolders('title contains "' + label +  '"')
  if (folders.hasNext()) {
    fromLabelBackupFolder = folders.next();
  } else {
    fromLabelBackupFolder = gmailBackupFolder.createFolder(label);
  }
  
  Logger.log("Creating spreasheet with name: " + fileName);
  var spreadSheet = SpreadsheetApp.create(fileName);
 
  /* bad */ 
  sleep(1000);
  Logger.log("continuing");

  var files = DriveApp.searchFiles('title contains "' + fileName + '"');
  var file;
  if (files.hasNext()) {
    file = files.next();
  } else {
    throw "The Spreadsheet not found:" + fileName;
  }
  
  var file1 = file.makeCopy(fromLabelBackupFolder);
  DriveApp.getFileById(file.getId()).setTrashed(true);
  /* Move done */
  
  spreadSheet = SpreadsheetApp.open(file1);
  var activeSheet = spreadSheet.getSheets()[0];
  
  var threads = GmailApp.search('label:' + label)
  
  var maxMessageCount = 90
  for (var i = 0; i < threads.length && maxMessageCount > 0; i++) {
    var thread = threads[i];
    var messages = thread.getMessages();
    for (var j =0; j < messages.length; j++) {
      try {
        var message = messages[j];
        var from = message.getFrom();
        var to = message.getTo();
        var cc = message.getCc();
        var bcc = message.getBcc();
        var date = message.getDate();
        var subject = message.getSubject();
        var raw = message.getRawContent();
        var replyTo = message.getReplyTo();
        var id = message.getId();
        
        //var attachments = message.getAttachments();
        
        var row = [];
        row.push(id);
        row.push(from);
        row.push(to);
        row.push(cc);
        row.push(bcc);
        row.push(replyTo);
        row.push(date);
        row.push(subject);
        row.push(raw);
        /* save attachments in new file : but it will consume space 
        for(var k = 0; k < attachments.length; k++) {
          var attachment = attachments[k];
          var name = attachment.getName();
          var type = attachment.getContentType();
          var isGoogleType = attachment.isGoogleType()
          var blob = attachment.copyBlob();
          var attachmentId = id + name + date;
          row.push(attachmentId);
          
          //save Attachment
          blob = blob.setName(attachmentId);
          DriveApp.createFile(blob);
          
        }*/
        /* TODO: use bulk insert */
        activeSheet.appendRow(row);
        maxMessageCount--;
        GmailApp.moveMessageToTrash(message);
      } catch(err) {
        Logger.log("Error encountered(probably too big attachment):" + err.message);  
      }
    }
    //GmailApp.moveThreadToTrash(thread);
  }
}
