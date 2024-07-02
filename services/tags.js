const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const eventEmitter = new EventEmitter();
const filePath = path.join(__dirname, '../data/tags.json');

let tags = [];
let tagIds = [];

eventEmitter.on('dataChanged', (tags) => {
    sortTags(tags);
    updateTagsData(tags)
});

readTagsData();

function readTagsData() {
    const data = fs.readFileSync(filePath, 'utf-8');
    tags = JSON.parse(data);
    if (tagIds.length === 0) {
        tagIds = tags.map((tag) => tag.id);
    }
}

function updateTagsData(tags) {
    fs.writeFileSync(filePath, JSON.stringify(tags, null, 2));
}

function getTagsData() {
    return tags;
}

function populateTags(tagIdsArray) {
    return tagIdsArray.map((tagId) => {
        const tag = tags.find((tagObj) => tagObj.id === tagId);
        return tag ? { ...tag } : null;
    });
}

function increamentTagsCount(tagIdsArray) {
    tagIdsArray.forEach((tagId) => {
        const tag = tags.find((tagObj) => tagObj.id === tagId);
        if (tag) tag.count++;
    });
    eventEmitter.emit('dataChanged', tags);
}

function decreamentTagsCount(tagIdsArray) {
    tagIdsArray.forEach((tagId) => {
        const tag = tags.find((tagObj) => tagObj.id === tagId);
        if (tag) {
            tag.count--;
        }
    });
    eventEmitter.emit('dataChanged', tags);
}

function updateTagsCounts({ previousTagIds, latestTagIds }) {
    const removedTagIds = previousTagIds.filter((tagId) => !latestTagIds.includes(tagId));
    const newlyAddedTagIds = latestTagIds.filter((tagId) => !previousTagIds.includes(tagId));

    decreamentTagsCount(removedTagIds);
    increamentTagsCount(newlyAddedTagIds);
    eventEmitter.emit('dataChanged', tags);

}

function sortTags(tags) {
    tags.sort((a, b) => b.count - a.count)
}

module.exports = {
    getTagsData,
    tagIds,
    updateTagsData,
    populateTags,
    increamentTagsCount,
    decreamentTagsCount,
    updateTagsCounts
};

