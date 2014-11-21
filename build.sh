#!/bin/bash
branchName=`git branch | grep '^*' | awk '{print $2}'`
tagName=`git tag | tail -1`
OUTPUTFILE=color_source-$branchName-$tagName.xpi
sed -i "s/<em:version>.\+<\/em:version>/<em:version>$tagName<\/em:version>/" install.rdf
zip -x '.git/' -r ~/$OUTPUTFILE *
echo "Created extension file ~/$OUTPUTFILE"

