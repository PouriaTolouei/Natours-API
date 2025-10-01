class APIFeatures {
  constructor(query, queryObj) {
    this.query = query; // The query promise being carried out
    this.queryObj = queryObj; // The query object containing query options
  }

  /**
   * Performs filtering on the query results.
   * @returns the query promise after filtering
   */
  filter() {
    // Filtering (matching field values)

    // Makes a copy of the query object to avoid changing the original object
    const queryObj = { ...this.queryObj };
    // Excludes special fields that need seperate handling
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced Filtering (range operators)

    // Converts query object into a query string for easier manipulation
    let quertStr = JSON.stringify(queryObj);
    // Corrects the formatting of range operators by adding $
    quertStr = quertStr.replace(/\b(gte|lte|gt|lt)\b/g, (match) => `$${match}`);
    // Converts query string back to an object and uses it to filter query promise
    this.query = this.query.find(JSON.parse(quertStr));

    return this;
  }

  /**
   * Performs sorting on the query results.
   * @returns the query promise after sorting
   */
  sort() {
    // Checks for custom sorting options
    if (this.queryObj.sort) {
      // Builds a sort option string
      const sortBy = this.queryObj.sort.split(',').join(' ');
      // Sorts query promise
      this.query = this.query.sort(sortBy);
    } else {
      // If not, sorts query promise using creation date/time (descending) by default
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  /**
   * Selects fields to be displayed in the query result.
   * @returns the query promise after limiting the fields
   */
  limitFields() {
    // Checks for custom field limit options
    if (this.queryObj.fields) {
      // Builds a string of desired fields
      const limitBy = this.queryObj.fields.split(',').join(' ');
      // Limits the fields of the query promise
      this.query = this.query.select(limitBy);
    } else {
      // If not, hides the __v database field of the query promise by default
      this.query = this.query.select('-__v');
    }

    return this;
  }

  /**
   * Organizes query results into pages containing the provided limit number of documents and retrieves a provided page only.
   * @returns the query promise after pagination
   */
  paginate() {
    // Extracts page number and page document limit
    const page = this.queryObj.page * 1 || 1; // By default show first page
    const limit = this.queryObj.limit * 1 || 100; // By default show 100 documents per page

    // Calculates how many documents to skip to get to the desired page
    const skip = limit * (page - 1);

    // Gets the desired page with the desired number of documents of the query promise
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
