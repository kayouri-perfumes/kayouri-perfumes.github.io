export const schemaTypes = [
  {
    name: 'perfume',
    title: 'المنتجات (Perfumes)',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'اسم العطر',
        type: 'string',
      },
      {
        name: 'slug',
        title: 'Slug (رابط المنتج)',
        type: 'slug',
        options: {
          source: 'name',
          maxLength: 96,
        },
        validation: Rule => Rule.required(),
      },
      {
        name: 'price',
        title: 'الثمن (بالدرهم)',
        type: 'number',
      },
      {
        name: 'category',
        title: 'الفئة (رجال/نساء)',
        type: 'string',
        options: {
          list: [
            { title: 'نسائي', value: 'women' },
            { title: 'رجالي', value: 'men' },
          ],
          layout: 'radio',
        },
      },
      {
        name: 'image',
        title: 'صورة العطر',
        type: 'image',
        options: { hotspot: true },
      },
      {
        name: 'description',
        title: 'وصف العطر',
        type: 'text',
      }
    ]
  }
]