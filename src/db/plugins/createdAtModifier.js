export const createdAtModifier = schema => {
  schema.add({
    createdAt: Date,
    userId: {
      type: String,
    },
  });

  schema.pre('save', function(next) {
    if (this._id == undefined) {
      this.createdAt = new Date();
    }
    next();
  });
};
