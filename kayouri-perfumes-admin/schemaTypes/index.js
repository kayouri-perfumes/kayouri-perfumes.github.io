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
            layout: 'radio', // كيعطيك دوائر تختار منهم بالزربة
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