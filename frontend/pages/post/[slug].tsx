import { GetStaticPaths, GetStaticProps, GetStaticPropsContext } from 'next'; // Import GetStaticPropsContext
import groq from 'groq';
import imageUrlBuilder from '@sanity/image-url';
import client from '../../client';
import PortableText from 'react-portable-text';

interface Author {
  name: string;
  image: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
}

interface Category {
  title: string;
}

interface Post {
  title: string;
  name: string;
  categories: Category[];
  author: Author;
  body: any[]; // Use the actual type for PortableText blocks
}

function urlFor(source: any) {
  return imageUrlBuilder(client).image(source);
}

const serializers = {
  types: {
    image: ({ node }: { node: any }) => {
      if (!node?.asset?._ref) {
        return null;
      }
      return (
        <img
          alt={node.alt || ' '}
          loading="lazy"
          src={urlFor(node).width(320).height(240).fit('max').auto('format').url()}
        />
      );
    },
  },
};

const Post: React.FC<{ post: Post }> = ({ post }) => {
  const { title = 'Missing title', name = 'Missing name', categories, author, body = [] } = post;

  return (
    <article>
      <h1>{title}</h1>
      <span>By {name}</span>
      {categories && (
        <ul>
          Posted in {categories.map((category) => <li key={category.title}>{category.title}</li>)}
        </ul>
      )}
      {author.image && (
        <div>
          <img
            src={urlFor(author.image.asset._ref).width(50).url()}
            alt={author.image.alt ? `${name}'s picture` : 'Author Picture'}
          />
        </div>
      )}
      <PortableText content={body} serializers={serializers} />
    </article>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = await client.fetch(groq`*[_type == "post" && defined(slug.current)][].slug.current`);

  return {
    paths: paths.map((slug: string) => ({ params: { slug } })), // Specify 'string' type for 'slug'
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<{ post: Post }> = async (context: GetStaticPropsContext) => {
  const { slug } = context.params!;
  const post = await client.fetch(query, { slug: slug as string });
  return {
    props: {
      post,
    },
  };
};

export default Post;

const query = groq`*[_type == "post" && slug.current == $slug][0]{
  title,
  "name": author->name,
  "categories": categories[]->title,
  "author": {
    "name": author->name,
    "image": author->image
  },
  body
}`;
