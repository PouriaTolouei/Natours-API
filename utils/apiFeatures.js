class APIFeatures {
  constructor(query, queryObj) {
    this.query = query;
    this.queryObj = queryObj;
  }

  filter() {
    // 1 A) Filtering
    const queryObj = { ...this.queryObj };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1 B) Advanced Filtering
    let quertStr = JSON.stringify(queryObj);
    quertStr = quertStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(quertStr));

    return this;
  }

  sort() {
    // 2) Sorting
    if (this.queryObj.sort) {
      const sortBy = this.queryObj.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    // 3) Field Limiting
    if (this.queryObj.fields) {
      const limitBy = this.queryObj.fields.split(',').join(' ');
      this.query = this.query.select(limitBy);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // 4) Pagination
    const page = this.queryObj.page * 1 || 1;
    const limit = this.queryObj.limit * 1 || 100;
    const skip = limit * (page - 1);

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
