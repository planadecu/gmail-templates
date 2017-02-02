GMail Templates and Snippet Manager Chrome Extension
====================================================

Tired of sending always the same type of email? Tired of copy pasting mails from Word, Drive, Dropbox and losing styles, layouts and colours?

GMail Template and Snippets Manager allows you to manage a list of predefined templates and insert them directly to your "compose mail" view.

A powerful templating engine is provided so you don't have to replace the fields inside the template manually. Pop-ups are going to ask you what data do you want to insert.
### Scripting engine

The generated templates can include tags that are parsed and allowed to be filled when the template is inserted. This is useful when the template contains some variable parts that you don�t want to replace manually every time.

##### Sample

Dear `${1:text:Insert name}`,

The total amount of your invoice is USD `${3:number:Total budget}` that you can pay via wire transfer to the following bank account: ` ${2:text:Bank account number}`

The invoice will be done with name: `${1}`

Yours faithfully,
`${me}`

##### How does it work?

The first parameter  ${`1`:text:Insert name} is the order in which the data is going to be asked. In the previous example first we will be prompted the <i>name</i>, then the <i>bank account</i> and then the <i>budget</i>.

The second parameter is the type of the data asked ${1:`text`:Insert name}. The accepted types are: `text`,`number`,`check`.

The third parameter is the title in which the data will be asked ${1:text:`Insert name`}. We will get a prompt box with the "Insert name" label.

You can refer to previously inserted data without retyping it by indicating the number on the first parameter: `${1}`. If no data was inserted nothing will be added.

There are some special tags like `${me}` that don't ask anything to the user but insert the current email address.

##### Import / Export

All the templates can be exported and imported to other accounts. Templates can be backed up to the preferred storage.

### Multilanguage
Supports GMail in several languages:
* English
* Spanish
* French
* German
* Polish
* Portuguese
* Dutch
* Danish
* Norwegian
* Swedish
* Danish
* Korean
* Chinese
* Japanese
* Arab
* Catalan
* Hebrew
* Hungarian

### Version

Current version: 1.6.0

### License
The software is free to use and integrate in other platforms. 

Licensed under: WYSYWYG but you can't copy it. License - Jordi Planadecursach
Contact: planadecu at gmail

### Donations
Donate bitcoins to 1P6WR8KJeUmJZLPNXXyoKTEgMQvn3k8jd7 if you like.
