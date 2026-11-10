/**
 * Privacy Policy (Figma 2155:85343) and Terms & Conditions (2155:85588).
 * Copy is taken from the designs and is a DRAFT pending legal review —
 * the pages say so. Blocks: `p` paragraph, `ul` dash list, `steps` labelled steps.
 */
export type Block = { p: string } | { ul: string[] } | { steps: { label: string; text: string }[] };
export interface Clause {
  title?: string;
  body: Block[];
}
export interface Section {
  id: string;
  title: string;
  meta?: [string, string];
  intro?: Block[];
  clauses: Clause[];
  outro?: Block[];
}
export interface LegalDoc {
  eyebrow?: string;
  title: string;
  lead: string;
  sections: Section[];
}

const CONTACT: Block[] = [
  { p: 'sales@hifonix.co.uk' },
  { p: '0121 382 5444' },
  { p: '396 Birmingham Road, Sutton Coldfield, B72 1YJ.' },
];

export const PRIVACY: LegalDoc = {
  eyebrow: 'Our Commitment To Your Privacy',
  title: 'Privacy Policy',
  lead: 'We take your privacy seriously. When you share your details with us, we use rigorous security measures to ensure your data remains safe and responsible.',
  sections: [
    {
      id: 'data',
      title: 'Data Protection',
      meta: ['Hifonix Privacy Policy', 'Effective Date: 14/09/2024'],
      intro: [
        {
          p: 'At Hifonix, we take your privacy seriously and are committed to safeguarding your personal information. This Privacy Policy outlines how we collect, use, and share your data when you visit our website, including the use of Google Analytics for tracking purposes.',
        },
      ],
      clauses: [
        {
          title: 'Information We Collect',
          body: [
            { p: 'When you visit the Hifonix website, we may collect both personal and non-personal information:' },
            { p: 'Personal Information: You may provide us with your details, such as your name, email address, and phone number, when you contact us, subscribe to our newsletter, or make purchases.' },
            { p: 'Non-Personal Information: We automatically collect non-personal information using cookies and tracking technologies, including Google Analytics. This data may include:' },
            { ul: ['IP address', 'Browser type', 'Device information', 'Pages visited', 'Time spent on our website', 'Referring/exit pages'] },
          ],
        },
        {
          title: 'Use of Google Analytics',
          body: [
            { p: 'Hifonix uses Google Analytics, a service provided by Google, Inc., to help us understand how visitors interact with our website. Google Analytics collects data such as:' },
            { ul: ['The pages you visit and your activity on our site', 'Demographic information (age, gender, interests)', 'Geographical location', 'Traffic sources (how you found our website)'] },
            { p: 'Google Analytics helps us improve our website, tailor our content, and enhance the user experience.' },
          ],
        },
        {
          title: 'How Google Analytics Works',
          body: [
            {
              p: 'Google Analytics uses cookies—small text files stored on your device that track your interactions with our site. The information collected by the cookie is sent to and stored by Google on servers in the United States. For detailed information on how Google uses the data, please visit the Google Privacy & Terms page.',
            },
          ],
        },
        {
          title: 'How We Use the Information',
          body: [
            { p: 'The data we collect through Google Analytics is used to:' },
            { ul: ['Analyze how users interact with our website', 'Improve the performance and functionality of our site', 'Provide personalized content and offers', 'Monitor traffic and trends to optimize marketing efforts'] },
            { p: 'Hifonix does not use Google Analytics data to identify individual users; all data is anonymised wherever possible.' },
          ],
        },
        {
          title: 'Opting Out of Google Analytics',
          body: [
            { p: 'If you do not want Google Analytics to track your data, you can:' },
            { p: 'Disable Cookies: Adjust your browser settings to block cookies.' },
            { p: 'Use Google’s Opt-out Tool: Install the Google Analytics Opt-out Browser Add-on to prevent your data from being collected across all websites.' },
          ],
        },
        {
          title: 'Sharing of Information',
          body: [
            { p: 'We do not sell, trade, or otherwise transfer your data to outside parties, except in the following circumstances:' },
            { p: 'Service providers who assist us in operating our website or conducting business, and are bound by confidentiality agreements.' },
            { p: 'As required by law, to comply with legal processes, or to protect the safety and security of our users and our business.' },
            { p: 'Google may also share data in accordance with their privacy policies.' },
          ],
        },
        {
          title: 'Data Retention',
          body: [
            {
              p: 'We retain the information collected through Google Analytics for a maximum of [retention period to be confirmed], after which it is automatically deleted. You can request the deletion of your personal information or data by contacting us directly.',
            },
          ],
        },
        {
          title: 'Your Rights',
          body: [
            { p: 'Depending on your location, you may have the right to:' },
            { ul: ['Access the personal data we have collected about you', 'Request corrections or deletion of your personal information', 'Opt out of tracking and targeted marketing', 'Withdraw consent for data collection at any time'] },
            { p: 'For further details about your privacy rights, contact us using the information below.' },
          ],
        },
        {
          title: 'Changes to This Privacy Policy',
          body: [
            { p: 'Hifonix reserves the right to update this Privacy Policy time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by updating the “Effective Date” at the top of this policy.' },
          ],
        },
        {
          title: 'Contact Information',
          body: [
            { p: 'If you have any questions, concerns, or requests regarding this Privacy Policy or how your data is handled, please reach out to us at:' },
            ...CONTACT,
            { p: 'We do not share these details with anyone.' },
          ],
        },
      ],
    },
    {
      id: 'third-party',
      title: 'Third Party Services',
      clauses: [
        {
          body: [
            {
              p: 'At Hifonix we do make use of third-party services, namely from Google to analyse the behaviour of customers online so that we can cater exactly to their needs. During this process, no personal customer data is stored. The only data we monitor are the links you visit whilst browsing on our website so be rest assured that no sensitive data is held on our systems.',
            },
          ],
        },
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies',
      clauses: [
        {
          body: [
            {
              p: 'Cookies are small files which are stored on a user’s computer. They are designed to hold a modest amount of data specific to a particular client and website, and can be accessed either by the web server or the client computer. This allows the server to deliver a page tailored to a particular user, or the page itself can contain some script which is aware of the data in the cookie and so is able to carry information from one visit to the website (or related site) to the next.',
            },
          ],
        },
      ],
    },
    {
      id: 'feedback',
      title: 'Policy Feedback',
      clauses: [
        {
          body: [
            {
              p: 'We welcome any feedback or questions you may have regarding our Privacy and Cookies Policy and we’ll be more than willing to go over these aspects in more detail. If you would like to contact us you can do so via our contact form or by post at: Hifonix, 396 Birmingham Road, Sutton Coldfield, West Midlands, B72 1YJ.',
            },
          ],
        },
      ],
    },
  ],
};

export const TERMS: LegalDoc = {
  title: 'Terms & Conditions',
  lead: 'By accessing the Hifonix website, you agree to comply with these Terms and Conditions. We are committed to protecting your privacy and safeguarding your personal information across our services.',
  sections: [
    {
      id: 'general',
      title: 'Goods, Pricing, and Availability',
      clauses: [
        {
          title: 'Product Descriptions',
          body: [
            {
              p: 'While we strive to ensure that all graphical representations and descriptions of goods on hifonix.co.uk accurately reflect the actual products, variations may occur. This does not exempt us from liability for errors due to our negligence and applies only to variations of the correct goods, not entirely different products.',
            },
          ],
        },
        { title: 'Product Specifications', body: [{ p: 'Depending on the product, you may be required to select specific options such as size, model, colour, or other features when placing your order.' }] },
        {
          title: 'Stock Availability',
          body: [{ p: 'In-stock items are typically dispatched within 1-3 days. “Available to order” items refer to products that are either en route to us, special order items, or those that are shipped directly from the distributor to you.' }],
        },
        { title: 'Pricing', body: [{ p: 'All prices listed on the website are accurate at the time of posting. We reserve the right to change prices and modify or remove special offers as necessary.' }] },
        { title: 'Price Changes', body: [{ p: 'If a price changes after you place an order but before we process it and take payment, we will contact you with the updated price before proceeding.' }] },
        { title: 'VAT', body: [{ p: 'All prices on the website include VAT unless otherwise stated.' }] },
        { title: 'Order Availability', body: [{ p: 'Your order is subject to availability. If we are unable to supply the goods, we will inform you and will not charge you. Any payments made will be refunded in full.' }] },
        { title: 'Site data accuracy', body: [{ p: 'We strive to maintain accurate pricing and stock levels, but occasionally, mistakes can happen. After all, we’re only human.' }] },
        {
          title: 'Hifonix Terms and Conditions – International Orders',
          body: [
            {
              steps: [
                {
                  label: 'Import Duties and Taxes',
                  text: 'International customers are responsible for any applicable import duties, taxes, and customs fees imposed by their country’s government. These charges are not included in the purchase price or shipping cost and must be settled directly with the relevant customs authority upon the arrival of the goods.',
                },
                {
                  label: 'Customs Clearance and Delays',
                  text: 'Customs policies vary widely by country, and Hifonix has no control over potential delays or additional fees that may arise during the customs clearance process. Customers are advised to check with their local customs office to understand the import regulations applicable to their order.',
                },
                {
                  label: 'Refusal to Pay Duties and Taxes',
                  text: 'If a customer refuses to pay import duties or taxes, resulting in the order being returned or abandoned, any additional costs incurred (including return shipping fees, storage fees, or disposal charges) will be deducted from the refund amount. Shipping fees paid at the time of purchase are non-refundable.',
                },
                {
                  label: 'Liability Disclaimer',
                  text: 'Hifonix is not liable for any additional costs, delays, or issues arising from the import process. By placing an international order, the customer agrees to accept full responsibility for all applicable charges and requirements.',
                },
              ],
            },
          ],
        },
      ],
      outro: [{ p: 'For further assistance, please contact our support team before placing your order.' }],
    },
    {
      id: 'returns',
      title: 'Damaged Goods And Returns Policy',
      intro: [{ p: 'At Hifonix, we strive to ensure your complete satisfaction with every purchase. If you are unsatisfied with your purchase, we are here to help. Please review our returns policy below.' }],
      clauses: [
        {
          title: 'Returns Policy',
          body: [
            { p: 'Unopened Items: You may return unopened items within 30 days of the purchase date for a full refund or exchange.' },
            { p: 'Opened Items: You may return opened items within 14 days of the purchase date for a refund or exchange, subject to inspection and a possible restocking fee.' },
          ],
        },
        {
          title: 'Exclusions',
          body: [
            { p: 'The following items are not eligible for return or exchange:' },
            {
              ul: [
                'Earphones: For hygiene reasons, we do not accept returns on earphones once the packaging has been opened.',
                'Perishable Products: Perishable items cannot be returned.',
                'Limited Edition Products: Limited edition products are non-returnable.',
                'Special Order Items: Items ordered specially at the customer’s request cannot be returned or exchanged.',
              ],
            },
          ],
        },
        {
          title: 'Conditions for Return',
          body: [{ p: 'To be eligible for a return, the item must be in the same condition that you received it, and in the original packaging. The item must include all accessories, manuals, and documentation.' }],
        },
        {
          title: 'Process for Returns',
          body: [
            {
              steps: [
                { label: 'Step 1', text: 'Contact our customer service team at sales@hifonix.co.uk or call 0121 382 5444 to initiate a return. Please provide your order number, the item(s) you wish to return, and the reason for return.' },
                { label: 'Step 2', text: 'Our team will provide you with a Return Merchandise Authorization (RMA) number and instructions on how to return your item.' },
                { label: 'Step 3', text: 'Pack the item securely in its original packaging, including all accessories, manuals, and documentation. Clearly write the RMA number on the outside of the package.' },
                { label: 'Step 4', text: 'Ship the item to the address provided by our customer service team. We recommend using a trackable shipping method.' },
              ],
            },
          ],
        },
        {
          title: 'Refunds',
          body: [
            {
              p: 'Once we receive your item, we will inspect it and notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment within 7 – 14 days. Please note that shipping costs are non-refundable.',
            },
          ],
        },
        { title: 'Exchanges', body: [{ p: 'If you wish to exchange an item, please contact our customer service team. Exchanges are subject to product availability.' }] },
        {
          title: 'Damaged or Defective Items',
          body: [{ p: 'If you receive a damaged or defective item, please contact us immediately. We will arrange for a replacement or refund, including any shipping costs incurred.' }],
        },
        {
          body: [{ p: 'Please ensure both packaging and product are in sellable condition. If the packaging or good/s are not in sellable condition, a charge may be applied to compensate for lost value.' }],
        },
        {
          title: 'Contact Us',
          body: [
            { p: 'For any questions or concerns regarding our returns policy, please contact us at:' },
            ...CONTACT,
            { p: 'We appreciate your business and aim to provide a hassle-free return process.' },
          ],
        },
      ],
    },
    {
      id: 'guarantee',
      title: 'Guarantee',
      clauses: [
        {
          title: 'Product Warranties',
          body: [
            {
              p: 'All products sold on our website are covered by the manufacturer’s warranty. Please refer to the product documentation for specific warranty details. Our liability is limited to the repair, replacement, or refund of the product, as per the manufacturer’s warranty.',
            },
          ],
        },
        {
          title: 'Limitation of Liability',
          body: [
            {
              p: 'To the fullest extent permitted by UK law, we shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products. This includes but is not limited to loss of profits, data, or other intangibles.',
            },
          ],
        },
      ],
    },
    {
      id: 'cancellation',
      title: 'Effects Of Cancellation',
      intro: [{ p: 'Termination and Cancellation' }],
      clauses: [
        {
          title: 'Termination by Either Party',
          body: [
            {
              p: 'Either Hifonix or you may terminate your account at any time. If we terminate your account, you will be notified via email with an explanation, though we reserve the right to terminate without providing reasons.',
            },
          ],
        },
        { title: 'Effect of Termination by Us', body: [{ p: 'If we terminate your account, any current or pending orders will be cancelled and will not be dispatched.' }] },
        { title: 'Cancellation of Purchases', body: [{ p: 'We reserve the right to cancel any purchase before processing payment or dispatch, without stating reasons.' }] },
        { title: 'Refunds on Cancellations', body: [{ p: 'If an order is cancelled before dispatch, any payments made will be refunded.' }] },
        { title: 'Termination by You', body: [{ p: 'If you terminate your account, any unshipped purchases will be cancelled, and you will receive a refund for payments made.' }] },
      ],
    },
  ],
};
