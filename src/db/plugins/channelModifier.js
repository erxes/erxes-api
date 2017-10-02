export const channelModifier = schema => {
  schema.add({
    conversationCount: {
      type: Number,
    },
    openConversationCount: {
      type: Number,
    },
  });

  schema.pre('save', function(next) {
    this.conversationCount = 0;
    this.openConversationCount = 0;
    const memberIds = this.memberIds == null ? [] : this.memberIds;
    if (memberIds.indexOf(this.userId) === -1) {
      memberIds.push(this.userId);
    }
    this.memberIds = memberIds;
    next();
  });
};
