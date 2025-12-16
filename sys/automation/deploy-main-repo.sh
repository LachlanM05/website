#!/bin/bash
# If you are setting this up on your own machine, please ensure that
# you leave none of this stuff public for people to see.

# conf
REPO_USER="GithubUser"
REPO_NAME="RepoName"
BRANCH="main"
TARGET_DIR="/srv/main" # this is where I store my main server files at
TEMP_ZIP="/tmp/${REPO_NAME}_${BRANCH}.zip"
TEMP_CONF="/tmp/${REPO_NAME}_conf"
EXCLUDE_LIST="/tmp/${REPO_NAME}_excludes"

# first, download zip.
echo "Downloading latest release..."
curl -L -o "$TEMP_ZIP" "https://github.com/$REPO_USER/$REPO_NAME/archive/refs/heads/$BRANCH.zip"

if [ ! -f "$TEMP_ZIP" ]; then
    echo "Error: Download failed."
    exit 1
fi

# extract conf file specifically
# use a wildcard, as github will probably put it in a folder like [repo].zip/[repo]/[files]   <-- need to fact check
echo "Peeking for config..."
bsdtar -x -f "$TEMP_ZIP" -O "*/sys/.conf" > "$TEMP_CONF" 2>/dev/null

# parse the config, avoiding source
if [ -s "$TEMP_CONF" ]; then
    echo "Config found. Parsing..."
    
    # extract content between quotes for ignore
    IGNORES=$(grep '^IGNORE_FILES=' "$TEMP_CONF" | cut -d'"' -f2)
    
    # create an exclujde list, newline seperated
    echo "$IGNORES" | tr ' ' '\n' > "$EXCLUDE_LIST"
else
    echo "No config found or empty. Proceeding without exclusions."
    > "$EXCLUDE_LIST"
fi

# extract to target
echo "Extracting to $TARGET_DIR..."
mkdir -p "$TARGET_DIR"

bsdtar -x -f "$TEMP_ZIP" \
    -C "$TARGET_DIR" \
    --strip-components=1 \
    --exclude-from "$EXCLUDE_LIST"

# cleanup (clean sweep fortnite emote)
rm "$TEMP_ZIP" "$TEMP_CONF" "$EXCLUDE_LIST"
echo "Deployment Complete."